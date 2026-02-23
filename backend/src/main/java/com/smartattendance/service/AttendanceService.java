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
import org.springframework.scheduling.annotation.Async;
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
    private final GoogleSheetsService googleSheetsService;

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
     * 
     * @param processFullHistory if true, processes ALL dates in chat. If false,
     *                           processes only last 7 days.
     */
    @Transactional
    public List<AttendanceDTO> processWhatsAppAttendance(String chatText, LocalDate targetDate,
            boolean processFullHistory) {
        logger.info("Processing WhatsApp attendance. Target date provided: {}", targetDate);

        // Parse WhatsApp messages (Returns Date -> (Sender -> Entry))
        Map<LocalDate, Map<String, WhatsAppParser.AttendanceEntry>> fullAttendanceMap = whatsAppParser
                .parseChat(chatText);

        if (fullAttendanceMap.isEmpty()) {
            logger.warn("No attendance data found in chat text.");
            return List.of();
        }

        // Filter dates to process history in order
        List<LocalDate> sortedDates = new java.util.ArrayList<>(fullAttendanceMap.keySet());
        java.util.Collections.sort(sortedDates);

        // Filter for relevant dates (Optimization: limit history if not full)
        LocalDate startDateLimit = processFullHistory ? LocalDate.of(2026, 1, 1) : targetDate.minusDays(7);
        List<LocalDate> datesToProcess = sortedDates.stream()
                .filter(d -> !d.isBefore(startDateLimit))
                .filter(d -> d.getYear() >= 2026) // Sanity check for year
                .collect(Collectors.toList());

        if (datesToProcess.isEmpty()) {
            logger.warn("No relevant dates to process within the specified range.");
            return List.of();
        }

        LocalDate minDate = datesToProcess.get(0);
        LocalDate maxDate = datesToProcess.get(datesToProcess.size() - 1);
        logger.info("Bulk processing {} dates from {} to {}...", datesToProcess.size(), minDate, maxDate);

        // PRE-FETCH everything in bulk
        List<Employee> allEmployees = employeeRepository.findByIsActiveTrueWithGroup();

        // 1. Existing Attendance Map (Date -> EmployeeId -> Attendance)
        List<Attendance> allExisting = attendanceRepository.findWithEmployeeByDateRange(minDate, maxDate);
        Map<LocalDate, Map<Long, Attendance>> existingMap = new java.util.HashMap<>();
        for (Attendance a : allExisting) {
            if (a.getEmployee() != null) {
                existingMap.computeIfAbsent(a.getDate(), k -> new java.util.HashMap<>()).put(a.getEmployee().getId(), a);
            }
        }

        // 2. Approved Leaves (Date -> Set of EmployeeIds)
        Map<LocalDate, java.util.Set<Long>> leafMap = leaveService.getEmployeeIdsOnApprovedLeaveForDateRange(minDate,
                maxDate);

        // 3. Holidays (Set of Dates)
        java.util.Set<LocalDate> holidayDates = holidayService.getHolidayDatesForRange(minDate, maxDate);

        // 4. Existing WhatsApp Logs to avoid duplicates (Format "Sender|Date")
        java.util.Set<String> existingLogKeys = whatsAppLogRepository.findByDateBetween(minDate, maxDate).stream()
                .map(log -> log.getSender() + "|" + log.getDate())
                .collect(Collectors.toSet());

        // Lists to collect all changes for bulk saving
        List<Attendance> allToSave = new java.util.ArrayList<>();
        List<WhatsAppLog> allLogsToSave = new java.util.ArrayList<>();
        List<Attendance> allSheetUpdates = new java.util.ArrayList<>();

        // MAIN PROCESSING LOOP (Zero DB queries inside)
        for (LocalDate date : datesToProcess) {
            Map<String, WhatsAppParser.AttendanceEntry> dailyParsed = fullAttendanceMap.get(date);
            Map<Long, Attendance> dailyExisting = existingMap.getOrDefault(date, java.util.Collections.emptyMap());
            java.util.Set<Long> dailyLeaves = leafMap.getOrDefault(date, java.util.Collections.emptySet());
            boolean isHoliday = holidayDates.contains(date) || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY;

            java.util.Set<String> matchedKeys = new java.util.HashSet<>();

            for (Employee employee : allEmployees) {
                Attendance existing = dailyExisting.get(employee.getId());
                boolean hasWhatsAppSource = existing != null && "WHATSAPP".equals(existing.getSource());
                boolean isAbsentStatus = existing != null && existing.getStatus() == AttendanceStatus.ABSENT;

                // Only overwrite if no record exists, or if current record is auto-generated/Absent
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
                } else if (dailyLeaves.contains(employee.getId())) {
                    status = AttendanceStatus.LEAVE;
                } else if (entry != null && entry.getInTime() != null) {
                    status = entry.isWfh() ? AttendanceStatus.WFH : AttendanceStatus.WFO;
                } else {
                    status = AttendanceStatus.ABSENT;
                }

                // Update or Create
                if (existing != null) {
                    existing.setInTime(entry != null ? entry.getInTime() : null);
                    existing.setOutTime(entry != null ? entry.getOutTime() : null);
                    existing.setStatus(status);
                    existing.setSource("WHATSAPP");
                    allToSave.add(existing);
                    
                    // Trigger sheet update if needed
                    if (employee.getGroup() != null && employee.getGroup().getGoogleSheetId() != null) {
                        allSheetUpdates.add(existing);
                    }
                } else {
                    Attendance newRecord = Attendance.builder()
                            .employee(employee)
                            .date(date)
                            .inTime(entry != null ? entry.getInTime() : null)
                            .outTime(entry != null ? entry.getOutTime() : null)
                            .status(status)
                            .source("WHATSAPP")
                            .build();
                    allToSave.add(newRecord);
                    
                    if (employee.getGroup() != null && employee.getGroup().getGoogleSheetId() != null) {
                        allSheetUpdates.add(newRecord);
                    }
                }
            }

            // Collect unmatched logs
            for (Map.Entry<String, WhatsAppParser.AttendanceEntry> parsedEntry : dailyParsed.entrySet()) {
                String sender = parsedEntry.getKey();
                if (!matchedKeys.contains(sender)) {
                    String logKey = sender + "|" + date;
                    if (!existingLogKeys.contains(logKey)) {
                        WhatsAppParser.AttendanceEntry entryData = parsedEntry.getValue();
                        allLogsToSave.add(WhatsAppLog.builder()
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
        }

        // PERFORM BULK SAVES (Chunked for memory efficiency if needed, but saveAll is fine here)
        if (!allToSave.isEmpty()) {
            logger.info("Saving {} attendance records...", allToSave.size());
            // Small chunks of 500 to keep transactions manageable on free tier DB
            for (int i = 0; i < allToSave.size(); i += 500) {
                int end = Math.min(i + 500, allToSave.size());
                attendanceRepository.saveAll(allToSave.subList(i, end));
                attendanceRepository.flush();
            }
        }

        if (!allLogsToSave.isEmpty()) {
            logger.info("Saving {} unmatched logs...", allLogsToSave.size());
            for (int i = 0; i < allLogsToSave.size(); i += 500) {
                int end = Math.min(i + 500, allLogsToSave.size());
                whatsAppLogRepository.saveAll(allLogsToSave.subList(i, end));
                whatsAppLogRepository.flush();
            }
        }

        logger.info("Processing complete. Grouping Google Sheet updates...");

        // Async sheet sync remains the same
        if (!allSheetUpdates.isEmpty()) {
            final List<Attendance> sheetRecords = new java.util.ArrayList<>(allSheetUpdates);
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                // Same grouping logic as before...
                Map<String, Map<String, List<Attendance>>> groupedUpdates = sheetRecords.stream()
                        .filter(a -> a.getEmployee() != null && a.getEmployee().getGroup() != null)
                        .collect(Collectors.groupingBy(
                                a -> a.getEmployee().getGroup().getGoogleSheetId(),
                                Collectors.groupingBy(a -> a.getDate().getYear() + "-" + a.getDate().getMonthValue())));

                for (Map.Entry<String, Map<String, List<Attendance>>> sheetEntry : groupedUpdates.entrySet()) {
                    String sheetId = sheetEntry.getKey();
                    if (sheetId == null || sheetId.isBlank()) continue;

                    for (Map.Entry<String, List<Attendance>> monthEntry : sheetEntry.getValue().entrySet()) {
                        List<Attendance> records = monthEntry.getValue();
                        try {
                            String currentMonthName = records.get(0).getDate().getMonth().name().substring(0, 1).toUpperCase()
                                    + records.get(0).getDate().getMonth().name().substring(1).toLowerCase() + " Month";
                            googleSheetsService.updateAttendanceBatch(sheetId, currentMonthName, records);
                            Thread.sleep(1000); // Slight throttle
                        } catch (Exception e) {
                            logger.error("Sheet sync error: {}", e.getMessage());
                        }
                    }
                }
                logger.info("Google Sheet batch sync completed.");
            });
        }

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
     * Get raw Attendance entity by ID (for testing/debugging only).
     */
    public Attendance findRawAttendanceById(Long id) {
        return attendanceRepository.findById(id).orElse(null);
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
     * Ensures an attendance record exists for the given employee for today.
     * If not, creates one with default status (ABSENT, or LEAVE/HOLIDAY).
     * This ensures the employee appears in the daily attendance list immediately.
     */
    @Transactional
    public void ensureAttendanceForToday(Employee employee) {
        LocalDate today = LocalDate.now();
        if (!attendanceRepository.existsByEmployeeIdAndDate(employee.getId(), today)) {
            AttendanceStatus status;
            if (holidayService.isHoliday(today)) {
                status = AttendanceStatus.HOLIDAY;
            } else if (leaveService.isOnApprovedLeave(employee.getId(), today)) {
                status = AttendanceStatus.LEAVE;
            } else {
                status = AttendanceStatus.ABSENT;
            }

            Attendance attendance = Attendance.builder()
                    .employee(employee)
                    .date(today)
                    .status(status)
                    .source("SYSTEM")
                    .build();
            try {
                attendanceRepository.save(attendance);
                attendanceRepository.flush();
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                // Ignore: Someone else created it concurrently
                logger.debug("Attendance record for {} on {} was created concurrently.", employee.getName(), today);
            }
        }
    }

    /**
     * Process existing WhatsApp logs for a newly added or updated employee.
     */
    @Async
    @Transactional
    public void processUnmappedLogsForEmployee(Employee employee) {
        logger.info("Starting async background process: Matching unmapped WhatsApp logs for employee: {}",
                employee.getName());

        // Targeted search instead of findByMappedFalse() to avoid massive table scans
        List<WhatsAppLog> unmappedLogs = whatsAppLogRepository.findUnmappedPotentialMatches(
                employee.getName(),
                employee.getWhatsappName(),
                normalizePhone(employee.getPhone()));

        if (unmappedLogs.isEmpty()) {
            return;
        }

        String empNameNorm = normalizeName(employee.getName());
        String empWaNorm = employee.getWhatsappName() != null ? normalizeName(employee.getWhatsappName()) : null;
        String empPhoneNorm = employee.getPhone() != null ? normalizePhone(employee.getPhone()) : null;

        List<Attendance> attendancesToSave = new java.util.ArrayList<>();
        List<WhatsAppLog> logsToUpdate = new java.util.ArrayList<>();

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
                Attendance existing = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), log.getDate())
                        .orElse(null);

                // Determine correct status from log
                AttendanceStatus logStatus;
                if (holidayService.isHoliday(log.getDate())) {
                    logStatus = AttendanceStatus.HOLIDAY;
                } else if (leaveService.isOnApprovedLeave(employee.getId(), log.getDate())) {
                    logStatus = AttendanceStatus.LEAVE;
                } else if (log.getInTime() != null) {
                    logStatus = log.isWfh() ? AttendanceStatus.WFH : AttendanceStatus.WFO;
                } else {
                    logStatus = AttendanceStatus.ABSENT;
                }

                if (existing == null) {
                    attendancesToSave.add(Attendance.builder()
                            .employee(employee)
                            .date(log.getDate())
                            .inTime(log.getInTime())
                            .outTime(log.getOutTime())
                            .status(logStatus)
                            .source("WHATSAPP")
                            .build());
                } else {
                    // Update if existing is ABSENT or SYSTEM generated
                    boolean isPlaceholder = existing.getStatus() == AttendanceStatus.ABSENT
                            || "SYSTEM".equals(existing.getSource());
                    if (isPlaceholder && logStatus != AttendanceStatus.ABSENT) {
                        existing.setInTime(log.getInTime());
                        existing.setOutTime(log.getOutTime());
                        existing.setStatus(logStatus);
                        existing.setSource("WHATSAPP");
                        attendancesToSave.add(existing);
                    }
                }
                log.setMapped(true);
                logsToUpdate.add(log);
            }
        }

        if (!attendancesToSave.isEmpty()) {
            attendanceRepository.saveAll(attendancesToSave);
        }
        if (!logsToUpdate.isEmpty()) {
            whatsAppLogRepository.saveAll(logsToUpdate);
        }
    }
}
