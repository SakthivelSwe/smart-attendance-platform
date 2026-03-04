package com.smartattendance.service;

import com.smartattendance.dto.DashboardStatsDTO;
import com.smartattendance.entity.Employee;
import com.smartattendance.entity.User;
import com.smartattendance.enums.AttendanceStatus;
import com.smartattendance.enums.LeaveStatus;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import org.springframework.cache.annotation.Cacheable;
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
        private final UserRepository userRepository;
        private final TeamRepository teamRepository;

        private static final Logger logger = LoggerFactory.getLogger(DashboardService.class);

        /**
         * Organization-wide dashboard stats (Admin view).
         */
        @Cacheable(value = "dashboardStats")
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
                        long upcomingHolidays = Optional
                                        .ofNullable(holidayRepository.findByDateBetween(today, endOfMonth))
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

        /**
         * Team-specific dashboard stats.
         */
        public DashboardStatsDTO getTeamDashboardStats(Long teamId) {
                try {
                        teamRepository.findById(teamId)
                                        .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

                        LocalDate today = LocalDate.now();
                        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());

                        long totalEmployees = employeeRepository.countByTeamId(teamId);
                        long wfoToday = attendanceRepository.countByDateAndStatusAndTeam(today, AttendanceStatus.WFO,
                                        teamId);
                        long wfhToday = attendanceRepository.countByDateAndStatusAndTeam(today, AttendanceStatus.WFH,
                                        teamId);
                        long onLeaveToday = attendanceRepository.countByDateAndStatusAndTeam(today,
                                        AttendanceStatus.LEAVE, teamId);
                        long absentToday = attendanceRepository.countByDateAndStatusAndTeam(today,
                                        AttendanceStatus.ABSENT, teamId);
                        long pendingLeaves = 0; // TODO: filter by team when leave entity has team support
                        long upcomingHolidays = Optional
                                        .ofNullable(holidayRepository.findByDateBetween(today, endOfMonth))
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
                } catch (ResourceNotFoundException e) {
                        throw e;
                } catch (Exception e) {
                        logger.error("Error computing team dashboard stats for team {}: {}", teamId, e.getMessage(), e);
                        return DashboardStatsDTO.builder()
                                        .totalEmployees(0).presentToday(0).wfoToday(0).wfhToday(0)
                                        .onLeaveToday(0).absentToday(0).pendingLeaves(0).upcomingHolidays(0)
                                        .build();
                }
        }

        /**
         * Personal dashboard for a specific user — their own attendance stats.
         */
        public DashboardStatsDTO getMyDashboardStats(Long userId) {
                try {
                        User user = userRepository.findById(userId)
                                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

                        // Find the employee record linked by email
                        Optional<Employee> employeeOpt = employeeRepository.findByEmail(user.getEmail());
                        if (employeeOpt.isEmpty()) {
                                return DashboardStatsDTO.builder()
                                                .totalEmployees(0).presentToday(0).wfoToday(0).wfhToday(0)
                                                .onLeaveToday(0).absentToday(0).pendingLeaves(0).upcomingHolidays(0)
                                                .build();
                        }

                        Employee employee = employeeOpt.get();
                        LocalDate today = LocalDate.now();
                        int month = today.getMonthValue();
                        int year = today.getYear();
                        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());

                        // Monthly counts for this employee
                        long wfoThisMonth = attendanceRepository.countByEmployeeAndStatusAndMonth(
                                        employee.getId(), AttendanceStatus.WFO, month, year);
                        long wfhThisMonth = attendanceRepository.countByEmployeeAndStatusAndMonth(
                                        employee.getId(), AttendanceStatus.WFH, month, year);
                        long leavesThisMonth = attendanceRepository.countByEmployeeAndStatusAndMonth(
                                        employee.getId(), AttendanceStatus.LEAVE, month, year);
                        long absentThisMonth = attendanceRepository.countByEmployeeAndStatusAndMonth(
                                        employee.getId(), AttendanceStatus.ABSENT, month, year);

                        long pendingLeaves = Optional.ofNullable(leaveRepository.findByEmployeeId(employee.getId()))
                                        .orElse(Collections.emptyList()).stream()
                                        .filter(l -> l.getStatus() == LeaveStatus.PENDING)
                                        .count();

                        long upcomingHolidays = Optional
                                        .ofNullable(holidayRepository.findByDateBetween(today, endOfMonth))
                                        .orElse(Collections.emptyList()).size();

                        return DashboardStatsDTO.builder()
                                        .totalEmployees(1)
                                        .presentToday(wfoThisMonth + wfhThisMonth) // reused as "total present this
                                                                                   // month"
                                        .wfoToday(wfoThisMonth)
                                        .wfhToday(wfhThisMonth)
                                        .onLeaveToday(leavesThisMonth)
                                        .absentToday(absentThisMonth)
                                        .pendingLeaves(pendingLeaves)
                                        .upcomingHolidays(upcomingHolidays)
                                        .build();
                } catch (ResourceNotFoundException e) {
                        throw e;
                } catch (Exception e) {
                        logger.error("Error computing personal dashboard for user {}: {}", userId, e.getMessage(), e);
                        return DashboardStatsDTO.builder()
                                        .totalEmployees(0).presentToday(0).wfoToday(0).wfhToday(0)
                                        .onLeaveToday(0).absentToday(0).pendingLeaves(0).upcomingHolidays(0)
                                        .build();
                }
        }
}
