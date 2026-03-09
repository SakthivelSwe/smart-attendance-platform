package com.smartattendance.service;

import com.smartattendance.dto.AttendanceDTO;
import com.smartattendance.dto.WhatsAppImportRecordDTO;
import com.smartattendance.entity.*;
import com.smartattendance.enums.AttendanceStatus;
import com.smartattendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * WhatsAppImportService orchestrates the full import flow:
 *
 * 1. uploadVcf() — One-time setup: parse .vcf and store name->phone map in DB
 * 2. previewImport() — Parse WhatsApp chat, resolve names via VCF, match employees
 * 3. confirmImport() — Save the confirmed attendance records to database
 */
@Service
@RequiredArgsConstructor
public class WhatsAppImportService {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppImportService.class);

    private final VcfContactMapService vcfContactMapService;
    private final WhatsAppParser whatsAppParser;
    private final ContactMapRepository contactMapRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final GroupRepository groupRepository;
    private final HolidayService holidayService;
    private final LeaveService leaveService;

    // ========================================================================
    // STEP 1: Upload VCF — One-time setup
    // ========================================================================

    /**
     * Parse a VCF file and store the name->phone mappings for a given group.
     * Replaces any existing mappings for that group (idempotent — safe to re-upload).
     *
     * @param groupId      the attendance group this VCF belongs to
     * @param vcfStream    the .vcf file input stream
     * @return number of contacts loaded
     */
    @Transactional
    public int uploadVcf(Long groupId, InputStream vcfStream) throws Exception {
        AttendanceGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Attendance group not found: " + groupId));

        // Parse the VCF file
        Map<String, String> nameToPhone = vcfContactMapService.parseVcf(vcfStream);

        if (nameToPhone.isEmpty()) {
            throw new RuntimeException("No contacts found in the uploaded VCF file. Please check the file format.");
        }

        // Clear old mappings for this group before inserting new ones
        contactMapRepository.deleteByGroupId(groupId);

        // Build and save new entries
        List<ContactMapEntry> entries = new ArrayList<>();
        for (Map.Entry<String, String> e : nameToPhone.entrySet()) {
            entries.add(ContactMapEntry.builder()
                    .group(group)
                    .displayName(e.getKey())
                    .phoneNumber(e.getValue())
                    .build());
        }
        contactMapRepository.saveAll(entries);
        logger.info("VCF upload: {} contacts saved for group '{}'", entries.size(), group.getName());
        return entries.size();
    }

    /**
     * Get the count of loaded contacts for a group (to show in UI).
     */
    public long getContactMapCount(Long groupId) {
        return contactMapRepository.countByGroupId(groupId);
    }

    // ========================================================================
    // STEP 2: Preview Import — Parse WhatsApp chat, resolve & match
    // ========================================================================

    /**
     * Parse the WhatsApp export text and resolve sender names to employees.
     * Returns a preview list WITHOUT saving to the database.
     *
     * Priority of matching:
     *   1. VCF-resolved phone -> Employee phone match
     *   2. Sender name -> Employee whatsappName match
     *   3. Sender name -> Employee name match
     *   4. Sender (if looks like a phone number) -> Employee phone match
     *
     * @param groupId   the attendance group scope
     * @param chatText  the raw text from the WhatsApp .txt export
     * @return list of preview records (matched and unmatched)
     */
    public List<WhatsAppImportRecordDTO> previewImport(Long groupId, String chatText) {
        // 1. Load VCF contact map for this group: displayName -> phoneNumber
        Map<String, String> vcfMap = loadVcfMap(groupId);

        // 2. Parse the WhatsApp chat
        Map<LocalDate, Map<String, WhatsAppParser.AttendanceEntry>> parsedChat =
                whatsAppParser.parseChat(chatText);

        if (parsedChat.isEmpty()) {
            return Collections.emptyList();
        }

        // 3. Load all active employees for matching
        List<Employee> employees = employeeRepository.findByIsActiveTrueWithGroup();

        // Build quick-lookup maps for employees
        Map<String, Employee> phoneToEmployee = buildPhoneMap(employees);
        Map<String, Employee> waNameToEmployee = buildWaNameMap(employees);
        Map<String, Employee> nameToEmployee = buildNameMap(employees);

        // 4. Resolve each sender entry to a record
        List<WhatsAppImportRecordDTO> results = new ArrayList<>();

        for (Map.Entry<LocalDate, Map<String, WhatsAppParser.AttendanceEntry>> dayEntry : parsedChat.entrySet()) {
            LocalDate date = dayEntry.getKey();
            for (Map.Entry<String, WhatsAppParser.AttendanceEntry> senderEntry : dayEntry.getValue().entrySet()) {
                String sender = senderEntry.getKey();
                WhatsAppParser.AttendanceEntry entry = senderEntry.getValue();

                WhatsAppImportRecordDTO record = resolveRecord(
                        sender, entry, date, vcfMap, phoneToEmployee, waNameToEmployee, nameToEmployee);
                results.add(record);
            }
        }

        // Sort: matched first, then by date, then by sender
        results.sort(Comparator.comparing((WhatsAppImportRecordDTO r) -> !r.isMatched())
                .thenComparing(WhatsAppImportRecordDTO::getDate)
                .thenComparing(WhatsAppImportRecordDTO::getSenderName));

        return results;
    }

    private WhatsAppImportRecordDTO resolveRecord(
            String sender,
            WhatsAppParser.AttendanceEntry entry,
            LocalDate date,
            Map<String, String> vcfMap,
            Map<String, Employee> phoneToEmployee,
            Map<String, Employee> waNameToEmployee,
            Map<String, Employee> nameToEmployee) {

        Employee matched = null;
        String resolvedPhone = null;
        String matchMethod = null;

        // --- Method 1: VCF lookup: sender name -> phone -> employee ---
        String vcfPhone = vcfMap.get(sender);
        if (vcfPhone == null) {
            // Try case-insensitive / normalized name lookup
            String senderNorm = normalizeName(sender);
            for (Map.Entry<String, String> vcfEntry : vcfMap.entrySet()) {
                if (normalizeName(vcfEntry.getKey()).equals(senderNorm)) {
                    vcfPhone = vcfEntry.getValue();
                    break;
                }
            }
        }

        if (vcfPhone != null) {
            resolvedPhone = vcfPhone;
            matched = phoneToEmployee.get(vcfPhone);
            if (matched != null) {
                matchMethod = "VCF_NAME";
            }
        }

        // --- Method 2: WhatsApp name -> employee.whatsappName ---
        if (matched == null) {
            matched = waNameToEmployee.get(normalizeName(sender));
            if (matched != null) {
                matchMethod = "WHATSAPP_NAME";
            }
        }

        // --- Method 3: Sender name -> employee.name ---
        if (matched == null) {
            matched = nameToEmployee.get(normalizeName(sender));
            if (matched != null) {
                matchMethod = "EMPLOYEE_NAME";
            }
        }

        // --- Method 4: Sender looks like a phone number -> employee.phone ---
        if (matched == null) {
            String senderPhone = vcfContactMapService.normalizePhone(sender);
            if (senderPhone.length() >= 7) {
                resolvedPhone = senderPhone;
                matched = phoneToEmployee.get(senderPhone);
                if (matched != null) {
                    matchMethod = "PHONE";
                }
            }
        }

        // Determine status string
        String status;
        if (entry.getInTime() != null) {
            status = entry.isWfh() ? "WFH" : "WFO";
        } else {
            status = "UNKNOWN";
        }

        return WhatsAppImportRecordDTO.builder()
                .senderName(sender)
                .resolvedPhone(resolvedPhone)
                .employeeId(matched != null ? matched.getId() : null)
                .employeeName(matched != null ? matched.getName() : null)
                .employeeCode(matched != null ? matched.getEmployeeCode() : null)
                .date(date)
                .inTime(entry.getInTime())
                .outTime(entry.getOutTime())
                .wfh(entry.isWfh())
                .status(status)
                .matched(matched != null)
                .matchMethod(matchMethod)
                .build();
    }

    // ========================================================================
    // STEP 3: Confirm Import — Save attendance records
    // ========================================================================

    /**
     * Save the attendance records that the user has confirmed in the preview.
     * Only saves records where employeeId is set (matched records).
     *
     * @param records  the confirmed records from the preview (with employeeId populated)
     * @return list of saved AttendanceDTOs
     */
    @Transactional
    public List<AttendanceDTO> confirmImport(List<WhatsAppImportRecordDTO> records) {
        List<Employee> allEmployees = employeeRepository.findByIsActiveTrueWithGroup();
        Map<Long, Employee> empById = allEmployees.stream()
                .collect(Collectors.toMap(Employee::getId, e -> e));

        List<Attendance> toSave = new ArrayList<>();
        Set<String> queued = new HashSet<>();

        for (WhatsAppImportRecordDTO record : records) {
            if (record.getEmployeeId() == null) continue; // Skip unmatched

            Employee employee = empById.get(record.getEmployeeId());
            if (employee == null) continue;

            String key = employee.getId() + "|" + record.getDate();
            if (!queued.add(key)) continue; // Dedup

            // Determine final status
            LocalDate date = record.getDate();
            AttendanceStatus status;
            if (holidayService.isHoliday(date) || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                status = AttendanceStatus.HOLIDAY;
            } else if (leaveService.isOnApprovedLeave(employee.getId(), date)) {
                status = AttendanceStatus.LEAVE;
            } else if (record.getInTime() != null) {
                status = record.isWfh() ? AttendanceStatus.WFH : AttendanceStatus.WFO;
            } else {
                status = AttendanceStatus.ABSENT;
            }

            // Check for existing record
            Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), date);
            if (existing.isPresent()) {
                Attendance a = existing.get();
                // Only overwrite SYSTEM or ABSENT records
                if ("SYSTEM".equals(a.getSource()) || a.getStatus() == AttendanceStatus.ABSENT) {
                    a.setInTime(record.getInTime());
                    a.setOutTime(record.getOutTime());
                    a.setStatus(status);
                    a.setSource("WHATSAPP_IMPORT");
                    toSave.add(a);
                }
            } else {
                toSave.add(Attendance.builder()
                        .employee(employee)
                        .date(date)
                        .inTime(record.getInTime())
                        .outTime(record.getOutTime())
                        .status(status)
                        .source("WHATSAPP_IMPORT")
                        .remarks("Imported from WhatsApp export via VCF resolver")
                        .build());
            }
        }

        List<Attendance> saved = attendanceRepository.saveAll(toSave);
        logger.info("WhatsApp import confirmed: {} attendance records saved.", saved.size());

        return saved.stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    private Map<String, String> loadVcfMap(Long groupId) {
        List<ContactMapEntry> entries = contactMapRepository.findByGroupId(groupId);
        Map<String, String> map = new HashMap<>();
        for (ContactMapEntry e : entries) {
            map.put(e.getDisplayName(), e.getPhoneNumber());
        }
        return map;
    }

    private Map<String, Employee> buildPhoneMap(List<Employee> employees) {
        Map<String, Employee> map = new HashMap<>();
        for (Employee e : employees) {
            if (e.getPhone() != null && !e.getPhone().isBlank()) {
                String norm = vcfContactMapService.normalizePhone(e.getPhone());
                map.put(norm, e);
            }
        }
        return map;
    }

    private Map<String, Employee> buildWaNameMap(List<Employee> employees) {
        Map<String, Employee> map = new HashMap<>();
        for (Employee e : employees) {
            if (e.getWhatsappName() != null && !e.getWhatsappName().isBlank()) {
                map.put(normalizeName(e.getWhatsappName()), e);
            }
        }
        return map;
    }

    private Map<String, Employee> buildNameMap(List<Employee> employees) {
        Map<String, Employee> map = new HashMap<>();
        for (Employee e : employees) {
            if (e.getName() != null) {
                map.put(normalizeName(e.getName()), e);
            }
        }
        return map;
    }

    private String normalizeName(String name) {
        if (name == null) return "";
        return name.replaceAll("[^a-zA-Z0-9 ]", "").toLowerCase().trim();
    }

    private AttendanceDTO toDTO(Attendance a) {
        return AttendanceDTO.builder()
                .id(a.getId())
                .employeeId(a.getEmployee().getId())
                .employeeName(a.getEmployee().getName())
                .employeeCode(a.getEmployee().getEmployeeCode())
                .date(a.getDate())
                .inTime(a.getInTime())
                .outTime(a.getOutTime())
                .status(a.getStatus())
                .source(a.getSource())
                .remarks(a.getRemarks())
                .groupName(a.getEmployee().getGroup() != null ? a.getEmployee().getGroup().getName() : null)
                .build();
    }
}
