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
        return attendanceRepository.findWithEmployeeByDate(date).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByEmployee(Long employeeId) {
        return attendanceRepository.findWithEmployeeByEmployeeId(employeeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByEmployeeAndDateRange(Long employeeId, LocalDate start, LocalDate end) {
        return attendanceRepository.findWithEmployeeByEmployeeIdAndDateRange(employeeId, start, end).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByDateRange(LocalDate start, LocalDate end) {
        return attendanceRepository.findWithEmployeeByDateRange(start, end).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Process WhatsApp chat text and create attendance records.
     * Processes ALL dates found in the chat text.
     */
    public List<AttendanceDTO> processWhatsAppAttendance(String chatText, LocalDate targetDate) {
        logger.info("Processing WhatsApp attendance. Target date provided: {}", targetDate);

        // Parse WhatsApp messages (Returns Date -> (Sender -> Entry))
        Map<LocalDate, Map<String, WhatsAppParser.AttendanceEntry>> fullAttendanceMap = whatsAppParser
                .parseChat(chatText);

        if (fullAttendanceMap.isEmpty()) {
            logger.warn("No attendance data found in chat text.");
            return List.of();
        }

        // Get all active employees with their groups once
        List<Employee> allEmployees = employeeRepository.findByIsActiveTrueWithGroup();
        logger.info("Starting bulk attendance process for {} employees", allEmployees.size());

        // Sort dates to process history in order
        List<LocalDate> sortedDates = new java.util.ArrayList<>(fullAttendanceMap.keySet());
        java.util.Collections.sort(sortedDates);

        for (LocalDate date : sortedDates) {
            // Filter for current year (2026) early to avoid unnecessary DB load
            if (date.getYear() < 2026) {
                continue;
            }

            logger.info("Processing date: {}...", date);
            Map<String, WhatsAppParser.AttendanceEntry> dailyParsed = fullAttendanceMap.get(date);
            java.util.Set<String> matchedKeys = new java.util.HashSet<>();

            // PRE-FETCH: Get all existing attendance and leaves for this date in bulk
            // Use findWithEmployeeByDate to eagerly fetch employee associations
            List<Attendance> existingDaily = attendanceRepository.findWithEmployeeByDate(date);
            Map<Long, Attendance> employeeAttendanceMap = new java.util.HashMap<>();
            for (Attendance a : existingDaily) {
                if (a.getEmployee() != null) {
                    employeeAttendanceMap.put(a.getEmployee().getId(), a);
                }
            }

            java.util.Set<Long> leafEmployeeIds = leaveService.getEmployeeIdsOnApprovedLeaveForDate(date);
            boolean isHoliday = holidayService.isHoliday(date);

            List<Attendance> toSave = new java.util.ArrayList<>();

            for (Employee employee : allEmployees) {
                Attendance existing = employeeAttendanceMap.get(employee.getId());
                boolean hasWhatsAppSource = existing != null && "WHATSAPP".equals(existing.getSource());
                boolean isAbsentStatus = existing != null && existing.getStatus() == AttendanceStatus.ABSENT;

                // Only overwrite if no record exists, or if the current record is
                // auto-generated/Absent
                if (existing != null && !hasWhatsAppSource && !isAbsentStatus) {
                    continue;
                }

                WhatsAppParser.AttendanceEntry entry = null;

                // 1. Match by WhatsApp Name
                if (employee.getWhatsappName() != null) {
                    String waName = employee.getWhatsappName();
                    if (dailyParsed.containsKey(waName)) {
                        entry = dailyParsed.get(waName);
                        matchedKeys.add(waName);
                    } else {
                        String norm = normalizeName(waName);
                        for (String key : dailyParsed.keySet()) {
                            if (normalizeName(key).equals(norm)) {
                                entry = dailyParsed.get(key);
                                matchedKeys.add(key);
                                break;
                            }
                        }
                    }
                }

                // 2. Match by Employee Name
                if (entry == null) {
                    String name = employee.getName();
                    if (dailyParsed.containsKey(name)) {
                        entry = dailyParsed.get(name);
                        matchedKeys.add(name);
                    } else {
                        String norm = normalizeName(name);
                        for (String key : dailyParsed.keySet()) {
                            if (normalizeName(key).equals(norm)) {
                                entry = dailyParsed.get(key);
                                matchedKeys.add(key);
                                break;
                            }
                        }
                    }
                }

                // 3. Match by Phone
                if (entry == null && employee.getPhone() != null && !employee.getPhone().isBlank()) {
                    String empPhone = normalizePhone(employee.getPhone());
                    for (String sender : dailyParsed.keySet()) {
                        String senderNorm = normalizePhone(sender);
                        if (senderNorm.length() >= 5
                                && (senderNorm.equals(empPhone) || senderNorm.contains(empPhone))) {
                            entry = dailyParsed.get(sender);
                            matchedKeys.add(sender);
                            break;
                        }
                    }
                }

                // Determine new status
                AttendanceStatus status;
                if (isHoliday) {
                    status = AttendanceStatus.HOLIDAY;
                } else if (leafEmployeeIds.contains(employee.getId())) {
                    status = AttendanceStatus.LEAVE;
                } else if (entry != null && entry.getInTime() != null) {
                    status = entry.isWfh() ? AttendanceStatus.WFH : AttendanceStatus.WFO;
                } else {
                    status = AttendanceStatus.ABSENT;
                }

                // Prepare entity
                if (existing != null) {
                    existing.setInTime(entry != null ? entry.getInTime() : null);
                    existing.setOutTime(entry != null ? entry.getOutTime() : null);
                    existing.setStatus(status);
                    existing.setSource("WHATSAPP");
                    toSave.add(existing);
                } else {
                    toSave.add(Attendance.builder()
                            .employee(employee)
                            .date(date)
                            .inTime(entry != null ? entry.getInTime() : null)
                            .outTime(entry != null ? entry.getOutTime() : null)
                            .status(status)
                            .source("WHATSAPP")
                            .build());
                }
            }

            // Batch save for the date
            if (!toSave.isEmpty()) {
                attendanceRepository.saveAll(toSave);
            }

            // Save unmatched logs
            List<WhatsAppLog> logsToSave = new java.util.ArrayList<>();
            for (Map.Entry<String, WhatsAppParser.AttendanceEntry> parsedEntry : dailyParsed.entrySet()) {
                String sender = parsedEntry.getKey();
                if (!matchedKeys.contains(sender)) {
                    if (!whatsAppLogRepository.existsBySenderAndDate(sender, date)) {
                        WhatsAppParser.AttendanceEntry entryData = parsedEntry.getValue();
                        logsToSave.add(WhatsAppLog.builder()
                                .sender(sender)
                                .date(date)
                                .inTime(entryData.getInTime())
                                .outTime(entryData.getOutTime())
                                .wfh(entryData.isWfh())
                                .mapped(false)
                                .build());
                    }
                }
            }
            if (!logsToSave.isEmpty()) {
                whatsAppLogRepository.saveAll(logsToSave);
            }
        }

        logger.info("Successfully processed attendance history.");

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
