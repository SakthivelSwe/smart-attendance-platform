package com.smartattendance.service;

import com.smartattendance.dto.EmployeeReportCardDTO;
import com.smartattendance.dto.TeamComparisonDTO;
import com.smartattendance.dto.WorkTrendDTO;
import com.smartattendance.entity.Attendance;
import com.smartattendance.entity.Employee;
import com.smartattendance.entity.Team;
import com.smartattendance.enums.AttendanceStatus;
import com.smartattendance.repository.AttendanceRepository;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

        private final AttendanceRepository attendanceRepository;
        private final EmployeeRepository employeeRepository;
        private final TeamRepository teamRepository;

        @Transactional(readOnly = true)
        public List<TeamComparisonDTO> getTeamComparison(LocalDate startDate, LocalDate endDate) {
                List<Team> teams = teamRepository.findByIsActiveTrue();
                List<Attendance> attendances = attendanceRepository.findByDateBetween(startDate, endDate);

                Map<Long, List<Attendance>> attendanceByEmployee = attendances.stream()
                                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

                List<TeamComparisonDTO> comparisons = new ArrayList<>();

                for (Team team : teams) {
                        List<Employee> teamMembers = employeeRepository.findByTeamIdWithDetails(team.getId());
                        if (teamMembers.isEmpty())
                                continue;

                        long totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
                        long maxCapacity = teamMembers.size() * totalDays;

                        long totalPresent = 0;
                        long totalAbsent = 0;
                        long totalOnLeave = 0;

                        for (Employee member : teamMembers) {
                                List<Attendance> memberAttendances = attendanceByEmployee.getOrDefault(member.getId(),
                                                new ArrayList<>());
                                totalPresent += memberAttendances.stream()
                                                .filter(a -> a.getStatus() == AttendanceStatus.WFO
                                                                || a.getStatus() == AttendanceStatus.WFH)
                                                .count();
                                totalAbsent += memberAttendances.stream()
                                                .filter(a -> a.getStatus() == AttendanceStatus.ABSENT)
                                                .count();
                                totalOnLeave += memberAttendances.stream()
                                                .filter(a -> a.getStatus() == AttendanceStatus.LEAVE)
                                                .count();
                        }

                        double rate = maxCapacity > 0 ? ((double) (totalPresent + totalOnLeave) / maxCapacity) * 100
                                        : 0;

                        comparisons.add(TeamComparisonDTO.builder()
                                        .teamId(team.getId())
                                        .teamName(team.getName())
                                        .totalEmployees(teamMembers.size())
                                        .totalPresent(totalPresent)
                                        .totalAbsent(totalAbsent)
                                        .totalOnLeave(totalOnLeave)
                                        .attendanceRate(Math.round(rate * 100.0) / 100.0)
                                        .build());
                }

                return comparisons;
        }

        @Transactional(readOnly = true)
        public List<EmployeeReportCardDTO> getEmployeeReportCards(LocalDate startDate, LocalDate endDate) {
                List<Employee> employees = employeeRepository.findByIsActiveTrue();
                List<Attendance> attendances = attendanceRepository.findByDateBetween(startDate, endDate);

                Map<Long, List<Attendance>> attendanceByEmployee = attendances.stream()
                                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

                List<EmployeeReportCardDTO> cards = new ArrayList<>();
                long totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;

                for (Employee emp : employees) {
                        List<Attendance> empAttendances = attendanceByEmployee.getOrDefault(emp.getId(),
                                        new ArrayList<>());

                        long present = empAttendances.stream()
                                        .filter(a -> a.getStatus() == AttendanceStatus.WFO
                                                        || a.getStatus() == AttendanceStatus.WFH)
                                        .count();
                        long absent = empAttendances.stream()
                                        .filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
                        long onLeave = empAttendances.stream()
                                        .filter(a -> a.getStatus() == AttendanceStatus.LEAVE).count();
                        long wfh = empAttendances.stream()
                                        .filter(a -> a.getStatus() == AttendanceStatus.WFH).count();

                        double rate = totalDays > 0 ? ((double) (present + onLeave) / totalDays) * 100 : 0;

                        cards.add(EmployeeReportCardDTO.builder()
                                        .employeeId(emp.getId())
                                        .employeeName(emp.getName())
                                        .employeeCode(emp.getEmployeeCode())
                                        .teamName(emp.getTeam() != null ? emp.getTeam().getName() : "Unassigned")
                                        .totalWorkingDays(totalDays)
                                        .totalPresent(present)
                                        .totalAbsent(absent)
                                        .totalOnLeave(onLeave)
                                        .wfhDays(wfh)
                                        .attendanceRate(Math.round(rate * 100.0) / 100.0)
                                        .build());
                }
                return cards;
        }

        @Transactional(readOnly = true)
        public List<WorkTrendDTO> getWorkTrends(LocalDate startDate, LocalDate endDate) {
                List<Attendance> attendances = attendanceRepository.findByDateBetween(startDate, endDate);

                Map<LocalDate, List<Attendance>> byDate = attendances.stream()
                                .collect(Collectors.groupingBy(Attendance::getDate));

                List<WorkTrendDTO> trends = new ArrayList<>();

                LocalDate current = startDate;
                while (!current.isAfter(endDate)) {
                        List<Attendance> dayData = byDate.getOrDefault(current, new ArrayList<>());

                        long wfo = dayData.stream().filter(a -> a.getStatus() == AttendanceStatus.WFO).count();
                        long wfh = dayData.stream().filter(a -> a.getStatus() == AttendanceStatus.WFH).count();
                        long onLeave = dayData.stream().filter(a -> a.getStatus() == AttendanceStatus.LEAVE).count();

                        trends.add(WorkTrendDTO.builder()
                                        .date(current)
                                        .wfoCount(wfo)
                                        .wfhCount(wfh)
                                        .leaveCount(onLeave)
                                        .build());

                        current = current.plusDays(1);
                }

                return trends;
        }
}
