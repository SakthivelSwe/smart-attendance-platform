package com.smartattendance.service;

import com.smartattendance.dto.AttendanceDTO;
import com.smartattendance.entity.NotificationPreference;
import com.smartattendance.entity.Team;
import com.smartattendance.entity.User;
import com.smartattendance.enums.AttendanceStatus;
import com.smartattendance.enums.UserRole;
import com.smartattendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Central notification engine that orchestrates all team-based notifications.
 * All notification methods are @Async for non-blocking execution.
 */
@Service
@RequiredArgsConstructor
public class NotificationEngineService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationEngineService.class);

    private final EmailNotificationService emailNotificationService;
    private final EmailTemplateService emailTemplateService;
    private final NotificationPreferenceRepository preferenceRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final AttendanceService attendanceService;
    private final EmployeeRepository employeeRepository;

    /**
     * 3.3 Team daily summary email → Team Lead
     * Sends a summary of today's attendance for each team to its team lead.
     */
    @Async
    public void sendTeamDailySummaries(LocalDate date) {
        logger.info("Sending team daily summaries for {}", date);

        List<Team> teams = teamRepository.findByIsActiveTrue();
        for (Team team : teams) {
            try {
                if (team.getTeamLead() == null)
                    continue;

                User teamLead = team.getTeamLead();
                if (!isNotificationEnabled(teamLead.getId(), "teamDailySummary"))
                    continue;

                List<AttendanceDTO> teamAttendance = attendanceService.getAttendanceByTeamAndDate(team.getId(), date);
                if (teamAttendance.isEmpty())
                    continue;

                String html = emailTemplateService.buildTeamDailySummary(
                        team.getName(), teamLead.getName(), teamAttendance, date);

                emailNotificationService.sendHtmlEmail(
                        teamLead.getEmail(),
                        "📊 " + team.getName() + " Daily Summary - " + date,
                        html);

                logger.info("Team daily summary sent to TL {} for team {}", teamLead.getEmail(), team.getName());
            } catch (Exception e) {
                logger.error("Failed to send team summary for team {}: {}", team.getName(), e.getMessage());
            }
        }
    }

    /**
     * 3.4 Manager daily summary email — aggregated view across teams.
     */
    @Async
    public void sendManagerDailySummaries(LocalDate date) {
        logger.info("Sending manager daily summaries for {}", date);

        List<User> managers = userRepository.findByRole(UserRole.MANAGER);
        for (User manager : managers) {
            try {
                if (!isNotificationEnabled(manager.getId(), "managerDailySummary"))
                    continue;

                // Find teams managed by this manager
                List<Team> managedTeams = teamRepository.findByManagerId(manager.getId());
                if (managedTeams.isEmpty())
                    continue;

                Map<String, List<AttendanceDTO>> teamAttendanceMap = new LinkedHashMap<>();
                for (Team team : managedTeams) {
                    List<AttendanceDTO> teamAttendance = attendanceService.getAttendanceByTeamAndDate(team.getId(),
                            date);
                    if (!teamAttendance.isEmpty()) {
                        teamAttendanceMap.put(team.getName(), teamAttendance);
                    }
                }

                if (teamAttendanceMap.isEmpty())
                    continue;

                String html = emailTemplateService.buildManagerDailySummary(
                        manager.getName(), teamAttendanceMap, date);

                emailNotificationService.sendHtmlEmail(
                        manager.getEmail(),
                        "📈 Manager Daily Summary - " + date,
                        html);

                logger.info("Manager daily summary sent to {}", manager.getEmail());
            } catch (Exception e) {
                logger.error("Failed to send manager summary to {}: {}", manager.getEmail(), e.getMessage());
            }
        }
    }

    /**
     * 3.5 Absence alert → Team Lead
     * Notifies TL when team members are absent.
     */
    @Async
    public void sendAbsenceAlerts(LocalDate date) {
        logger.info("Sending absence alerts for {}", date);

        List<Team> teams = teamRepository.findByIsActiveTrue();
        for (Team team : teams) {
            try {
                if (team.getTeamLead() == null)
                    continue;

                User teamLead = team.getTeamLead();
                if (!isNotificationEnabled(teamLead.getId(), "absenceAlert"))
                    continue;

                List<AttendanceDTO> teamAttendance = attendanceService.getAttendanceByTeamAndDate(team.getId(), date);
                List<String> absentees = teamAttendance.stream()
                        .filter(a -> a.getStatus() == AttendanceStatus.ABSENT)
                        .map(AttendanceDTO::getEmployeeName)
                        .collect(Collectors.toList());

                if (absentees.isEmpty())
                    continue;

                String html = emailTemplateService.buildAbsenceAlert(
                        teamLead.getName(), team.getName(), absentees, date);

                emailNotificationService.sendHtmlEmail(
                        teamLead.getEmail(),
                        "🚨 Absence Alert: " + absentees.size() + " absent in " + team.getName(),
                        html);

                logger.info("Absence alert sent to TL {} for team {} ({} absent)",
                        teamLead.getEmail(), team.getName(), absentees.size());
            } catch (Exception e) {
                logger.error("Failed to send absence alert for team {}: {}", team.getName(), e.getMessage());
            }
        }
    }

    /**
     * 3.6 Low attendance alert → Manager
     * Alerts manager when a team's attendance drops below threshold.
     */
    @Async
    public void sendLowAttendanceAlerts(LocalDate date) {
        logger.info("Checking low attendance alerts for {}", date);

        List<User> managers = userRepository.findByRole(UserRole.MANAGER);
        for (User manager : managers) {
            try {
                if (!isNotificationEnabled(manager.getId(), "lowAttendanceAlert"))
                    continue;

                int threshold = getThreshold(manager.getId());
                List<Team> managedTeams = teamRepository.findByManagerId(manager.getId());

                for (Team team : managedTeams) {
                    List<AttendanceDTO> teamAttendance = attendanceService.getAttendanceByTeamAndDate(team.getId(),
                            date);
                    if (teamAttendance.isEmpty())
                        continue;

                    long present = teamAttendance.stream()
                            .filter(a -> a.getStatus() == AttendanceStatus.WFO || a.getStatus() == AttendanceStatus.WFH)
                            .count();
                    int percentage = (int) ((present * 100) / teamAttendance.size());

                    if (percentage < threshold) {
                        String html = emailTemplateService.buildLowAttendanceAlert(
                                manager.getName(), team.getName(), percentage, threshold, date);

                        emailNotificationService.sendHtmlEmail(
                                manager.getEmail(),
                                "⚠ Low Attendance: " + team.getName() + " at " + percentage + "%",
                                html);

                        logger.info("Low attendance alert sent to manager {} for team {} ({}% < {}%)",
                                manager.getEmail(), team.getName(), percentage, threshold);
                    }
                }
            } catch (Exception e) {
                logger.error("Failed to send low attendance alert to {}: {}", manager.getEmail(), e.getMessage());
            }
        }
    }

    /**
     * 4.6 Leave request email trigger → Team Lead
     */
    @Async
    public void sendLeaveRequestAlert(com.smartattendance.entity.Leave leave) {
        logger.info("Sending leave request alert for leave ID {}", leave.getId());
        try {
            Team team = leave.getEmployee().getTeam();
            if (team == null)
                return;

            User approver = team.getTeamLead() != null ? team.getTeamLead() : team.getManager();
            if (approver == null)
                return;

            if (!isNotificationEnabled(approver.getId(), "leaveRequestAlert"))
                return;

            String html = emailTemplateService.buildLeaveRequestAlert(
                    approver.getName(), leave.getEmployee().getName(),
                    leave.getStartDate(), leave.getEndDate(), leave.getReason(), leave.getLeaveType());

            emailNotificationService.sendHtmlEmail(
                    approver.getEmail(),
                    "📋 New Leave Request: " + leave.getEmployee().getName(),
                    html);

            logger.info("Leave request alert sent to {}", approver.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send leave request alert: {}", e.getMessage());
        }
    }

    /**
     * 4.7 Leave approval/rejection email → Employee
     */
    @Async
    public void sendLeaveStatusAlert(com.smartattendance.entity.Leave leave, String action, String remarks) {
        logger.info("Sending leave status alert for leave ID {}", leave.getId());
        try {
            User user = userRepository.findByEmail(leave.getEmployee().getEmail()).orElse(null);
            if (user == null || !isNotificationEnabled(user.getId(), "leaveStatusAlert"))
                return;

            String html = emailTemplateService.buildLeaveStatusAlert(
                    leave.getEmployee().getName(), action, remarks,
                    leave.getStartDate(), leave.getEndDate());

            emailNotificationService.sendHtmlEmail(
                    leave.getEmployee().getEmail(),
                    "ℹ️ Leave Request Status: " + action,
                    html);

            logger.info("Leave status alert sent to {}", leave.getEmployee().getEmail());
        } catch (Exception e) {
            logger.error("Failed to send leave status alert: {}", e.getMessage());
        }
    }

    /**
     * Master trigger — called after daily attendance processing.
     * Dispatches all applicable notifications.
     */
    @Async
    public void triggerAllDailyNotifications(LocalDate date) {
        logger.info("=== Triggering all daily notifications for {} ===", date);
        sendTeamDailySummaries(date);
        sendAbsenceAlerts(date);
        sendManagerDailySummaries(date);
        sendLowAttendanceAlerts(date);
    }

    /**
     * 5.7 Weekly digest email to Managers
     */
    @Async
    public void sendWeeklyDigest(LocalDate startDate, LocalDate endDate) {
        logger.info("Sending weekly digest emails for period {} to {}", startDate, endDate);
        List<User> managers = userRepository.findByRole(UserRole.MANAGER);

        for (User manager : managers) {
            try {
                if (!isNotificationEnabled(manager.getId(), "weeklyDigest"))
                    continue;

                List<Team> managedTeams = teamRepository.findByManagerId(manager.getId());
                StringBuilder content = new StringBuilder(
                        "<h3>Weekly Summary (" + startDate + " to " + endDate + ")</h3>");

                for (Team team : managedTeams) {
                    content.append("<p><b>Team:</b> ").append(team.getName()).append("</p>");
                    long employees = employeeRepository.countByTeamId(team.getId());
                    content.append("<ul><li>Total Members: ").append(employees).append("</li></ul>");
                }

                emailNotificationService.sendHtmlEmail(
                        manager.getEmail(),
                        "📊 Weekly Team Digest",
                        content.toString()); // Quick inline template build

                logger.info("Weekly digest sent to manager {}", manager.getEmail());
            } catch (Exception e) {
                logger.error("Failed to send weekly digest to {}: {}", manager.getEmail(), e.getMessage());
            }
        }
    }

    // ──── Preference helpers ────

    private boolean isNotificationEnabled(Long userId, String type) {
        Optional<NotificationPreference> prefOpt = preferenceRepository.findByUserId(userId);
        if (prefOpt.isEmpty())
            return true; // Default: enabled

        NotificationPreference pref = prefOpt.get();
        if (!Boolean.TRUE.equals(pref.getEmailEnabled()))
            return false;

        return switch (type) {
            case "teamDailySummary" -> Boolean.TRUE.equals(pref.getTeamDailySummary());
            case "absenceAlert" -> Boolean.TRUE.equals(pref.getAbsenceAlert());
            case "managerDailySummary" -> Boolean.TRUE.equals(pref.getManagerDailySummary());
            case "lowAttendanceAlert" -> Boolean.TRUE.equals(pref.getLowAttendanceAlert());
            case "leaveRequestAlert" -> Boolean.TRUE.equals(pref.getLeaveRequestAlert());
            case "leaveStatusAlert" -> Boolean.TRUE.equals(pref.getLeaveStatusAlert());
            default -> true;
        };
    }

    private int getThreshold(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .map(NotificationPreference::getLowAttendanceThreshold)
                .orElse(70);
    }
}
