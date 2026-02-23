package com.smartattendance.service;

import com.smartattendance.dto.MonthlySummaryDTO;
import com.smartattendance.entity.Attendance;
import com.smartattendance.entity.Employee;
import com.smartattendance.entity.MonthlySummary;
import com.smartattendance.enums.AttendanceStatus;
import com.smartattendance.repository.AttendanceRepository;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.MonthlySummaryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MonthlySummaryService {

    private static final Logger logger = LoggerFactory.getLogger(MonthlySummaryService.class);

    private final MonthlySummaryRepository summaryRepository;
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    public List<MonthlySummaryDTO> getSummaryByMonthAndYear(int month, int year) {
        return summaryRepository.findByMonthAndYear(month, year).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<MonthlySummaryDTO> getSummaryByEmployee(Long employeeId) {
        return summaryRepository.findByEmployeeId(employeeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Generate or update monthly summary for all employees for a given month/year.
     */
    @Transactional
    public List<MonthlySummaryDTO> generateMonthlySummary(int month, int year) {
        logger.info("Generating monthly summary for {}/{}", month, year);

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // 1. Fetch all active employees
        List<Employee> employees = employeeRepository.findByIsActiveTrue();
        
        // 2. Bulk fetch all attendance records for the month
        List<Attendance> allRecords = attendanceRepository.findByDateBetween(startDate, endDate);
        
        // Group attendance by employee ID
        java.util.Map<Long, List<Attendance>> attendanceByEmployee = allRecords.stream()
                .filter(a -> a.getEmployee() != null)
                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

        // 3. Bulk fetch existing summaries to avoid repeated lookups
        List<MonthlySummary> existingSummaries = summaryRepository.findByMonthAndYear(month, year);
        java.util.Map<Long, MonthlySummary> summaryMap = existingSummaries.stream()
                .collect(Collectors.toMap(s -> s.getEmployee().getId(), s -> s));

        List<MonthlySummary> summariesToSave = new java.util.ArrayList<>();

        for (Employee employee : employees) {
            List<Attendance> records = attendanceByEmployee.getOrDefault(employee.getId(), List.of());

            int wfo = 0, wfh = 0, leave = 0, holiday = 0, absent = 0, bench = 0, training = 0;

            for (Attendance record : records) {
                switch (record.getStatus()) {
                    case WFO -> wfo++;
                    case WFH -> wfh++;
                    case LEAVE -> leave++;
                    case HOLIDAY -> holiday++;
                    case ABSENT -> absent++;
                    case BENCH -> bench++;
                    case TRAINING -> training++;
                }
            }

            int totalWorkingDays = wfo + wfh + bench + training;
            int totalWorkingHours = totalWorkingDays * 8;

            MonthlySummary summary = summaryMap.get(employee.getId());
            if (summary == null) {
                summary = MonthlySummary.builder()
                        .employee(employee)
                        .month(month)
                        .year(year)
                        .build();
            }

            summary.setWfoCount(wfo);
            summary.setWfhCount(wfh);
            summary.setLeaveCount(leave);
            summary.setHolidayCount(holiday);
            summary.setAbsentCount(absent);
            summary.setBenchCount(bench);
            summary.setTrainingCount(training);
            summary.setTotalWorkingDays(totalWorkingDays);
            summary.setTotalWorkingHours(totalWorkingHours);

            summariesToSave.add(summary);
        }

        if (!summariesToSave.isEmpty()) {
            summaryRepository.saveAll(summariesToSave);
        }

        return getSummaryByMonthAndYear(month, year);
    }

    private MonthlySummaryDTO toDTO(MonthlySummary summary) {
        double attendancePercentage = 0;
        if (summary.getTotalWorkingDays() != null && summary.getTotalWorkingDays() > 0) {
            int present = (summary.getWfoCount() != null ? summary.getWfoCount() : 0)
                    + (summary.getWfhCount() != null ? summary.getWfhCount() : 0);
            attendancePercentage = (present * 100.0) / summary.getTotalWorkingDays();
        }

        return MonthlySummaryDTO.builder()
                .id(summary.getId())
                .employeeId(summary.getEmployee().getId())
                .employeeName(summary.getEmployee().getName())
                .employeeCode(summary.getEmployee().getEmployeeCode())
                .groupName(summary.getEmployee().getGroup() != null ? summary.getEmployee().getGroup().getName() : null)
                .month(summary.getMonth())
                .year(summary.getYear())
                .wfoCount(summary.getWfoCount())
                .wfhCount(summary.getWfhCount())
                .leaveCount(summary.getLeaveCount())
                .holidayCount(summary.getHolidayCount())
                .absentCount(summary.getAbsentCount())
                .benchCount(summary.getBenchCount())
                .trainingCount(summary.getTrainingCount())
                .totalWorkingDays(summary.getTotalWorkingDays())
                .totalWorkingHours(summary.getTotalWorkingHours())
                .attendancePercentage(Math.round(attendancePercentage * 100.0) / 100.0)
                .build();
    }
}
