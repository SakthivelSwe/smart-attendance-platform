package com.smartattendance.service;

import com.smartattendance.dto.AttendanceDTO;
import com.smartattendance.entity.Attendance;
import com.smartattendance.entity.Employee;
import com.smartattendance.enums.AttendanceStatus;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.AttendanceRepository;
import com.smartattendance.repository.EmployeeRepository;
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
     * Process WhatsApp chat text and create attendance records for a given date.
     */
    @Transactional
    public List<AttendanceDTO> processWhatsAppAttendance(String chatText, LocalDate date) {
        logger.info("Processing WhatsApp attendance for date: {}", date);

        // Parse WhatsApp messages
        Map<String, WhatsAppParser.AttendanceEntry> parsed = whatsAppParser.parseChat(chatText);

        // Get all active employees
        List<Employee> allEmployees = employeeRepository.findByIsActiveTrue();

        for (Employee employee : allEmployees) {
            // Skip if attendance already exists
            if (attendanceRepository.existsByEmployeeIdAndDate(employee.getId(), date)) {
                logger.debug("Attendance already exists for {} on {}", employee.getName(), date);
                continue;
            }

            AttendanceStatus status;
            WhatsAppParser.AttendanceEntry entry = null;

            // Match employee by WhatsApp name
            if (employee.getWhatsappName() != null) {
                entry = parsed.get(employee.getWhatsappName());
            }
            // Fallback: try matching by employee name
            if (entry == null) {
                entry = parsed.get(employee.getName());
            }

            // Determine status: Holiday > Leave > Parsed > Absent
            if (holidayService.isHoliday(date)) {
                status = AttendanceStatus.HOLIDAY;
            } else if (leaveService.isOnApprovedLeave(employee.getId(), date)) {
                status = AttendanceStatus.LEAVE;
            } else if (entry != null && entry.getInTime() != null) {
                status = entry.isWfh() ? AttendanceStatus.WFH : AttendanceStatus.WFO;
            } else {
                status = AttendanceStatus.ABSENT;
            }

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

        return getAttendanceByDate(date);
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
}
