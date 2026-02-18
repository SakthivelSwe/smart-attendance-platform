package com.smartattendance.service;

import com.smartattendance.dto.AttendanceDTO;
import com.smartattendance.entity.Attendance;
import com.smartattendance.entity.Employee;
import com.smartattendance.entity.WhatsAppLog;
import com.smartattendance.enums.AttendanceStatus;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.AttendanceRepository;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.WhatsAppLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceService.class);

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final HolidayService holidayService;
    private final LeaveService leaveService;
    private final WhatsAppParser whatsAppParser;
    private final WhatsAppLogRepository whatsAppLogRepository;

    public List<AttendanceDTO> getAttendanceByDate(LocalDate date) {
        return attendanceRepository.findByDate(date).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByEmployee(Long employeeId) {
        return attendanceRepository.findByEmployeeId(employeeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByEmployeeAndDateRange(Long employeeId, LocalDate start, LocalDate end) {
        return attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, start, end).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByDateRange(LocalDate start, LocalDate end) {
        return attendanceRepository.findByDateBetween(start, end).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Process WhatsApp chat text and create attendance records.
     * Processes ALL dates found in the chat text.
     */
    @Transactional
    public List<AttendanceDTO> processWhatsAppAttendance(String chatText, LocalDate targetDate) {
        logger.info("Processing WhatsApp attendance. Target date provided: {}", targetDate);

        // Parse WhatsApp messages (Returns Date -> (Sender -> Entry))
        Map<LocalDate, Map<String, WhatsAppParser.AttendanceEntry>> fullAttendanceMap = whatsAppParser
                .parseChat(chatText);

        if (fullAttendanceMap.isEmpty()) {
            logger.warn("No attendance data found in chat text.");
            return List.of();
        }

        // Get all active employees
        List<Employee> allEmployees = employeeRepository.findByIsActiveTrue();

        // Iterate through each date found in the chat
        for (Map.Entry<LocalDate, Map<String, WhatsAppParser.AttendanceEntry>> dateEntry : fullAttendanceMap
                .entrySet()) {
            LocalDate date = dateEntry.getKey();
            Map<String, WhatsAppParser.AttendanceEntry> dailyParsed = dateEntry.getValue();
            java.util.Set<String> matchedKeys = new java.util.HashSet<>();

            // Filter for current year (2026) early to avoid unnecessary DB load
            if (date.getYear() < 2026) {
                logger.debug("Skipping date {} as it is before 2026", date);
                continue;
            }

            logger.info("Processing attendance for date: {}", date);

            for (Employee employee : allEmployees) {
                // Determine if we should process this employee/date
                boolean shouldProcess = true;
                Attendance existing = null;

                if (attendanceRepository.existsByEmployeeIdAndDate(employee.getId(), date)) {
                    existing = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), date).orElse(null);
                    if (existing != null) {
                        // Only overwrite if it was auto-generated (WHATSAPP) or is currently ABSENT
                        if ("WHATSAPP".equals(existing.getSource())
                                || existing.getStatus() == AttendanceStatus.ABSENT) {
                            shouldProcess = true;
                        } else {
                            // Don't overwrite MANUAL or other verified records
                            shouldProcess = false;
                        }
                    }
                }

                if (!shouldProcess) {
                    continue;
                }
                AttendanceStatus status;
                WhatsAppParser.AttendanceEntry entry = null;

                // 1. Match by WhatsApp Name (Exact & Normalized)
                if (employee.getWhatsappName() != null) {
                    if (dailyParsed.containsKey(employee.getWhatsappName())) {
                        entry = dailyParsed.get(employee.getWhatsappName());
                        matchedKeys.add(employee.getWhatsappName());
                    } else {
                        // Try normalized match
                        String empWaNorm = normalizeName(employee.getWhatsappName());
                        for (String key : dailyParsed.keySet()) {
                            if (normalizeName(key).equals(empWaNorm)) {
                                entry = dailyParsed.get(key);
                                matchedKeys.add(key);
                                break;
                            }
                        }
                    }
                }

                // 2. Match by Employee Name (Exact & Normalized)
                if (entry == null) {
                    if (dailyParsed.containsKey(employee.getName())) {
                        entry = dailyParsed.get(employee.getName());
                        matchedKeys.add(employee.getName());
                    } else {
                        // Try normalized match
                        String empNameNorm = normalizeName(employee.getName());
                        for (String key : dailyParsed.keySet()) {
                            if (normalizeName(key).equals(empNameNorm)) {
                                entry = dailyParsed.get(key);
                                matchedKeys.add(key);
                                break;
                            }
                        }
                    }
                }

                // 3. Match by Phone Number (Normalize both sides)
                if (entry == null && employee.getPhone() != null && !employee.getPhone().isBlank()) {
                    String empPhone = normalizePhone(employee.getPhone());
                    if (empPhone.length() >= 5) {
                        for (String sender : dailyParsed.keySet()) {
                            String senderNorm = normalizePhone(sender);
                            if (senderNorm.length() >= 5) {
                                if (senderNorm.equals(empPhone) || senderNorm.contains(empPhone)
                                        || empPhone.contains(senderNorm)) {
                                    entry = dailyParsed.get(sender);
                                    matchedKeys.add(sender);
                                    break;
                                }
                            }
                        }
                    }
                }

                // Determine status
                if (holidayService.isHoliday(date)) {
                    status = AttendanceStatus.HOLIDAY;
                } else if (leaveService.isOnApprovedLeave(employee.getId(), date)) {
                    status = AttendanceStatus.LEAVE;
                } else if (entry != null && entry.getInTime() != null) {
                    status = entry.isWfh() ? AttendanceStatus.WFH : AttendanceStatus.WFO;
                } else {
                    status = AttendanceStatus.ABSENT;
                }

                // Only save if we have data or if we want to mark absent
                // If we are strictly processing "found" data, maybe we shouldn't mark everyone
                // as ABSENT for past dates?
                // But the requested feature implies "process attendance for these days".
                // Let's go with saving.

                // SKIP SAVING ABSENT for past dates to avoid cluttering DB with 'Absent' for
                // dates irrelevant to the export?
                // No, consistency is good. But creating Absent records for 2 years ago might be
                // bad.
                // Let's only save if status is NOT Absent OR if the date is close to
                // targetDate?
                // User said "update 01/01/2026 to 18/02/2026".
                // No longer needed here as it's filtered at the top of the loop
                // if (date.getYear() < 2026) {
                // continue;
                // }

                if (existing != null) {
                    // Update existing record
                    existing.setInTime(entry != null ? entry.getInTime() : null);
                    existing.setOutTime(entry != null ? entry.getOutTime() : null);
                    existing.setStatus(status);
                    existing.setSource("WHATSAPP"); // Refresh source
                    attendanceRepository.save(existing);
                } else {
                    Attendance attendance = Attendance.builder()
                            .employee(employee)
                            .date(date)
                            .inTime(entry != null ? entry.getInTime() : null)
                            .outTime(entry != null ? entry.getOutTime() : null)
                            .status(status)
                            .source("WHATSAPP")
                            .build();
                    attendanceRepository.save(attendance);
                }
            }

            // Save unmatched entries to WhatsAppLog table
            for (Map.Entry<String, WhatsAppParser.AttendanceEntry> parsedEntry : dailyParsed.entrySet()) {
                String sender = parsedEntry.getKey();
                if (!matchedKeys.contains(sender)) {
                    WhatsAppParser.AttendanceEntry entryData = parsedEntry.getValue();
                    // Avoid saving redundant/empty entries
                    if (!whatsAppLogRepository.existsBySenderAndDate(sender, date)) {
                        WhatsAppLog log = WhatsAppLog.builder()
                                .sender(sender)
                                .date(date)
                                .inTime(entryData.getInTime())
                                .outTime(entryData.getOutTime())
                                .wfh(entryData.isWfh())
                                .mapped(false)
                                .build();
                        whatsAppLogRepository.save(log);
                    }
                }
            }
        }

        // Return the 'targetDate' attendance to satisfy the Controller return type
        return getAttendanceByDate(targetDate);
    }

    private String normalizeName(String name) {
        if (name == null) {
            return "";
        }
        // Remove non-alphanumeric (keep spaces), lower case, trim
        // This effectively removes Emojis and special punctuations
        return name.replaceAll("[^a-zA-Z0-9 ]", "").toLowerCase().trim();
    }

    private String normalizePhone(String info) {
        if (info == null)
            return "";
        // Remove all non-digit characters
        String digits = info.replaceAll("[^0-9]", "");
        // Remove leading 91 (India country code) if present and length > 10
        if (digits.length() > 10 && digits.startsWith("91")) {
            return digits.substring(2);
        }
        return digits;
    }

    /**
     * Manually update an attendance record.
     */
    @Transactional
    public AttendanceDTO updateAttendance(Long id, AttendanceDTO dto) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance", "id", id));

        if (dto.getInTime() != null)
            attendance.setInTime(dto.getInTime());
        if (dto.getOutTime() != null)
            attendance.setOutTime(dto.getOutTime());
        if (dto.getStatus() != null)
            attendance.setStatus(dto.getStatus());
        if (dto.getRemarks() != null)
            attendance.setRemarks(dto.getRemarks());
        attendance.setSource("MANUAL");

        Attendance saved = attendanceRepository.save(attendance);
        return toDTO(saved);
    }

    private AttendanceDTO toDTO(Attendance attendance) {
        return AttendanceDTO.builder()
                .id(attendance.getId())
                .employeeId(attendance.getEmployee().getId())
                .employeeName(attendance.getEmployee().getName())
                .employeeCode(attendance.getEmployee().getEmployeeCode())
                .date(attendance.getDate())
                .inTime(attendance.getInTime())
                .outTime(attendance.getOutTime())
                .status(attendance.getStatus())
                .source(attendance.getSource())
                .remarks(attendance.getRemarks())
                .groupName(attendance.getEmployee().getGroup() != null ? attendance.getEmployee().getGroup().getName()
                        : null)
                .build();
    }

    /**
     * Process existing WhatsApp logs for a newly added or updated employee.
     */
    @Transactional
    public void processUnmappedLogsForEmployee(Employee employee) {
        List<WhatsAppLog> unmappedLogs = whatsAppLogRepository.findByMappedFalse();
        String empNameNorm = normalizeName(employee.getName());
        String empWaNorm = employee.getWhatsappName() != null ? normalizeName(employee.getWhatsappName()) : null;
        String empPhoneNorm = employee.getPhone() != null ? normalizePhone(employee.getPhone()) : null;

        for (WhatsAppLog log : unmappedLogs) {
            boolean matches = false;
            String sender = log.getSender();
            String senderNorm = normalizeName(sender);
            String senderPhoneNorm = normalizePhone(sender);

            // 1. WhatsApp Name Match
            if (empWaNorm != null && senderNorm.equals(empWaNorm)) {
                matches = true;
            }
            // 2. Employee Name Match
            else if (senderNorm.equals(empNameNorm)) {
                matches = true;
            }
            // 3. Phone Match
            else if (empPhoneNorm != null && empPhoneNorm.length() >= 5 && senderPhoneNorm.length() >= 5) {
                if (senderPhoneNorm.equals(empPhoneNorm) || senderPhoneNorm.contains(empPhoneNorm)
                        || empPhoneNorm.contains(senderPhoneNorm)) {
                    matches = true;
                }
            }

            if (matches) {
                // Check if attendance already exists for this date
                if (!attendanceRepository.existsByEmployeeIdAndDate(employee.getId(), log.getDate())) {
                    AttendanceStatus status;
                    if (holidayService.isHoliday(log.getDate())) {
                        status = AttendanceStatus.HOLIDAY;
                    } else if (leaveService.isOnApprovedLeave(employee.getId(), log.getDate())) {
                        status = AttendanceStatus.LEAVE;
                    } else if (log.getInTime() != null) {
                        status = log.isWfh() ? AttendanceStatus.WFH : AttendanceStatus.WFO;
                    } else {
                        status = AttendanceStatus.ABSENT;
                    }

                    Attendance attendance = Attendance.builder()
                            .employee(employee)
                            .date(log.getDate())
                            .inTime(log.getInTime())
                            .outTime(log.getOutTime())
                            .status(status)
                            .source("WHATSAPP")
                            .build();
                    attendanceRepository.save(attendance);
                }
                log.setMapped(true);
                whatsAppLogRepository.save(log);
            }
        }
    }
}
