package com.smartattendance.service;

import com.smartattendance.dto.DashboardStatsDTO;
import com.smartattendance.enums.AttendanceStatus;
import com.smartattendance.enums.LeaveStatus;
import com.smartattendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRepository leaveRepository;
    private final HolidayRepository holidayRepository;

    private static final Logger logger = LoggerFactory.getLogger(DashboardService.class);

    public DashboardStatsDTO getDashboardStats() {
        try {
            LocalDate today = LocalDate.now();
            LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());

            long totalEmployees = Optional.ofNullable(employeeRepository.findByIsActiveTrue())
                    .orElse(Collections.emptyList()).size();
            long wfoToday = attendanceRepository.countByDateAndStatus(today, AttendanceStatus.WFO);
            long wfhToday = attendanceRepository.countByDateAndStatus(today, AttendanceStatus.WFH);
            long onLeaveToday = attendanceRepository.countByDateAndStatus(today, AttendanceStatus.LEAVE);
            long absentToday = attendanceRepository.countByDateAndStatus(today, AttendanceStatus.ABSENT);
            long pendingLeaves = Optional.ofNullable(leaveRepository.findByStatus(LeaveStatus.PENDING))
                    .orElse(Collections.emptyList()).size();
            long upcomingHolidays = Optional.ofNullable(holidayRepository.findByDateBetween(today, endOfMonth))
                    .orElse(Collections.emptyList()).size();

            return DashboardStatsDTO.builder()
                    .totalEmployees(totalEmployees)
                    .presentToday(wfoToday + wfhToday)
                    .wfoToday(wfoToday)
                    .wfhToday(wfhToday)
                    .onLeaveToday(onLeaveToday)
                    .absentToday(absentToday)
                    .pendingLeaves(pendingLeaves)
                    .upcomingHolidays(upcomingHolidays)
                    .build();
        } catch (Exception e) {
            logger.error("Error computing dashboard stats: {}", e.getMessage(), e);
            return DashboardStatsDTO.builder()
                    .totalEmployees(0).presentToday(0).wfoToday(0).wfhToday(0)
                    .onLeaveToday(0).absentToday(0).pendingLeaves(0).upcomingHolidays(0)
                    .build();
        }
    }
}
