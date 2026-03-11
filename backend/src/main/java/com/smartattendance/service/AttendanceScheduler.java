package com.smartattendance.service;

import com.smartattendance.dto.AttendanceDTO;
import com.smartattendance.event.DailyAttendanceProcessedEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;
import java.util.concurrent.ScheduledFuture;

import java.time.LocalDate;
import java.util.List;
import com.smartattendance.repository.GmailAccountRepository;
import com.smartattendance.entity.GmailAccount;
import com.smartattendance.service.VcfContactMapService;

@Component
@RequiredArgsConstructor
public class AttendanceScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceScheduler.class);

    private final AttendanceService attendanceService;
    private final EmailNotificationService emailNotificationService;
    private final SystemSettingService systemSettingService;
    private final GmailService gmailService;
    private final GmailOAuthService gmailOAuthService;
    private final WhatsAppNotificationService whatsAppNotificationService;
    private final MonthlySummaryService monthlySummaryService;
    private final ApplicationEventPublisher eventPublisher;
    private final com.smartattendance.repository.GroupRepository groupRepository;
    private final GmailAccountRepository gmailAccountRepository;
    private final VcfContactMapService vcfContactMapService;

    @org.springframework.beans.factory.annotation.Value("${app.admin.emails:}")
    private String adminEmails;

    private org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler taskScheduler;

    private ScheduledFuture<?> reminderFuture;
    private ScheduledFuture<?> processingFuture;
    private ScheduledFuture<?> saturdayFuture;
    private ScheduledFuture<?> monthlyFuture;

    @PostConstruct
    public void init() {
        taskScheduler = new org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler();
        taskScheduler.setPoolSize(2);
        taskScheduler.setThreadNamePrefix("DynamicScheduler-");
        taskScheduler.initialize();
        rescheduleJobs();
    }

    public synchronized void rescheduleJobs() {
        logger.info("Scheduling/Rescheduling attendance jobs...");

        if (reminderFuture != null)
            reminderFuture.cancel(false);
        if (processingFuture != null)
            processingFuture.cancel(false);
        if (saturdayFuture != null)
            saturdayFuture.cancel(false);
        if (monthlyFuture != null)
            monthlyFuture.cancel(false);

        String reminderTime = systemSettingService.getSchedulerReminderTime();
        String processingTime = systemSettingService.getSchedulerProcessingTime();
        String reminderCron = timeToCron(reminderTime, "*");
        String processingCron = timeToCron(processingTime, "*");
        java.time.ZoneId zone = java.time.ZoneId.of("Asia/Kolkata");
        logger.info("Scheduling Reminder for: {}", reminderCron);
        reminderFuture = taskScheduler.schedule(this::checkImportStatus,
                new CronTrigger(reminderCron, zone));

        logger.info("Scheduling Weekday Processing for: {}", processingCron);
        processingFuture = taskScheduler.schedule(this::processWeekdays,
                new CronTrigger(processingCron, zone));

        saturdayFuture = taskScheduler.schedule(this::processSaturday,
                new CronTrigger("0 0 19 * * SAT", zone));

        monthlyFuture = taskScheduler.schedule(this::generateMonthlySummary,
                new CronTrigger("0 0 6 1 * *", zone));
    }

    private String timeToCron(String timeStr, String days) {
        try {
            String[] parts = timeStr.split(":");
            return String.format("0 %s %s * * %s", Integer.parseInt(parts[1]), Integer.parseInt(parts[0]), days);
        } catch (Exception e) {
            logger.error("Invalid time format: {}", timeStr);
            return "0 0 12 * * " + days;
        }
    }

    /**
     * Pre-check logic - configurable time (default 11:30 AM IST).
     * Reminds admin if attendance email is missing.
     */
    public void checkImportStatus() {
        logger.info("=== Checking for attendance email availability (Reminder Check) ===");

        boolean oauthConnected = gmailOAuthService.isConnected();
        String email = systemSettingService.getGmailEmail();
        String password = systemSettingService.getGmailPassword();

        // Need either OAuth or App Password to check
        if (!oauthConnected && (email == null || password == null)) {
            logger.warn("Reminder check skipped: No Gmail credentials (OAuth or App Password) configured.");
            return;
        }

        try {
            List<com.smartattendance.entity.AttendanceGroup> groups = groupRepository.findByIsActiveTrue();
            if (groups.isEmpty()) {
                logger.warn("No active attendance groups found. Reminder check skipped.");
                return;
            }

            boolean anyMissing = false;
            for (com.smartattendance.entity.AttendanceGroup group : groups) {
                String subjectPattern = group.getEmailSubjectPattern();
                if (subjectPattern == null || subjectPattern.isBlank()) {
                    subjectPattern = "WhatsApp Chat";
                }

                boolean exists = false;
                GmailAccount groupAccount = gmailAccountRepository.findByGroupId(group.getId()).orElse(null);
                boolean isUserOAuthConnected = (groupAccount != null && groupAccount.isActive()) || oauthConnected;

                if (isUserOAuthConnected) {
                    // Use OAuth2 to check email
                    exists = gmailOAuthService.hasAttendanceEmailForDate(subjectPattern, LocalDate.now(), groupAccount);
                } else if (email != null && password != null) {
                    exists = gmailService.hasAttendanceEmailForDate(email, password, subjectPattern, LocalDate.now());
                }

                if (!exists) {
                    logger.warn("No attendance email found for group '{}' (pattern: '{}') today.", group.getName(),
                            subjectPattern);
                    anyMissing = true;
                } else {
                    logger.info("Attendance email found for group '{}'.", group.getName());
                }
            }

            String notificationEmail = (email != null) ? email : gmailOAuthService.getConnectedEmail();

            if (anyMissing) {
                logger.warn("One or more attendance emails missing for today. Sending reminder based on preferences.");

                if (systemSettingService.isEmailReminderEnabled()) {
                    if (adminEmails != null && !adminEmails.isBlank()) {
                        for (String adminEmail : adminEmails.split(",")) {
                            emailNotificationService.sendReminderToAdmin(adminEmail.trim());
                        }
                    } else {
                        emailNotificationService.sendReminderToAdmin(notificationEmail);
                    }
                }

                if (systemSettingService.isWhatsAppReminderEnabled()) {
                    String whatsAppMessage = "*Attendance Reminder*\nOne or more attendance export emails not found for today. Please export the WhatsApp chat(s) immediately.";
                    whatsAppNotificationService.sendWhatsAppMessage(whatsAppMessage);
                }
            } else {
                logger.info("All attendance emails found. Ready for processing.");
            }
        } catch (Exception e) {
            logger.error("Error checking import status: {}", e.getMessage());
        }
    }

    /**
     * Weekday morning processing - configurable time (default 12:00 PM IST).
     */
    public void processWeekdays() {
        logger.info("=== Starting scheduled Weekday Morning attendance processing (12 PM) ===");
        runAutomaticProcess();
    }

    /**
     * Saturday evening processing - Saturdays at 7:00 PM IST.
     */
    public void processSaturday() {
        logger.info("=== Starting scheduled Saturday Evening attendance processing (7 PM) ===");
        runAutomaticProcess();
    }

    private void runAutomaticProcess() {
        LocalDate today = LocalDate.now();

        boolean oauthConnected = gmailOAuthService.isConnected();
        String email = systemSettingService.getGmailEmail();
        String password = systemSettingService.getGmailPassword();

        if (!oauthConnected && (email == null || password == null)) {
            logger.warn("Automatic processing skipped: Gmail credentials not configured in System Settings.");
            return;
        }

        try {
            List<com.smartattendance.entity.AttendanceGroup> groups = groupRepository.findByIsActiveTrue();
            if (groups.isEmpty()) {
                logger.warn("No active attendance groups found to process.");
                return;
            }

            logger.info("Automatically fetching WhatsApp attendance for {} groups on {}", groups.size(), today);

            for (com.smartattendance.entity.AttendanceGroup group : groups) {
                String subjectPattern = group.getEmailSubjectPattern();
                if (subjectPattern == null || subjectPattern.isBlank()) {
                    subjectPattern = "WhatsApp Chat";
                }

                GmailAccount groupAccount = gmailAccountRepository.findByGroupId(group.getId()).orElse(null);
                boolean isUserOAuthConnected = (groupAccount != null && groupAccount.isActive()) || oauthConnected;

                // 1. Process VCF silently
                try {
                    if (groupAccount != null && groupAccount.isActive()) {
                        byte[] vcfBytes = gmailOAuthService.fetchVcfAttachment(groupAccount);
                        if (vcfBytes != null) {
                            VcfContactMapService.VcfUploadResult result = vcfContactMapService
                                    .uploadAndFilter(group.getId(), new java.io.ByteArrayInputStream(vcfBytes));
                            logger.info("Auto-processed VCF for group '{}': {}", group.getName(), result.toMessage());
                        }
                    } else if (!isUserOAuthConnected && email != null && password != null) {
                        byte[] vcfBytes = gmailService.fetchVcfAttachment(email, password);
                        if (vcfBytes != null) {
                            VcfContactMapService.VcfUploadResult result = vcfContactMapService
                                    .uploadAndFilter(group.getId(), new java.io.ByteArrayInputStream(vcfBytes));
                            logger.info("Auto-processed VCF via App Password for group '{}': {}", group.getName(),
                                    result.toMessage());
                        }
                    }
                } catch (Exception ex) {
                    logger.warn("Auto VCF processing skipped for group '{}': {}", group.getName(), ex.getMessage());
                }

                // 2. Fetch Chat text
                String chatText = null;
                try {
                    if (isUserOAuthConnected) {
                        chatText = gmailOAuthService.fetchAttendanceEmailForDate(subjectPattern, today, groupAccount);
                    } else if (email != null && password != null) {
                        chatText = gmailService.fetchAttendanceEmailForDate(email, password, subjectPattern, today);
                    }
                } catch (Exception ex) {
                    logger.error("Failed to fetch email for group '{}': {}", group.getName(), ex.getMessage());
                }

                if (chatText != null && !chatText.isBlank()) {
                    // Pass true to ensure that we process the full chat for that export, similar to
                    // UI manual fetch
                    attendanceService.processWhatsAppAttendance(chatText, today, true);
                    logger.info("Automatically processed attendance from email for group '{}'", group.getName());
                } else {
                    logger.info("No attendance email found for group '{}' using pattern '{}'", group.getName(),
                            subjectPattern);
                }
            }

            String notificationEmail = (email != null) ? email : gmailOAuthService.getConnectedEmail();

            // Send daily summary email to admin
            List<AttendanceDTO> todayAttendance = attendanceService.getAttendanceByDate(today);
            if (!todayAttendance.isEmpty()) {
                try {
                    if (adminEmails != null && !adminEmails.isBlank()) {
                        for (String adminEmail : adminEmails.split(",")) {
                            emailNotificationService.sendDailySummaryEmail(todayAttendance, today, adminEmail.trim());
                        }
                    } else {
                        emailNotificationService.sendDailySummaryEmail(todayAttendance, today, notificationEmail);
                    }
                } catch (Exception ex) {
                    logger.warn("Failed to send daily summary email: {}", ex.getMessage());
                }

                // Publish event to trigger team-specific notifications
                eventPublisher.publishEvent(
                        new DailyAttendanceProcessedEvent(this, today, todayAttendance.size()));
            }

        } catch (Exception e) {
            logger.error("Error in automatic attendance processing: {}", e.getMessage(), e);
        }
    }

    /**
     * Monthly summary generation - runs on the 1st of every month at 6 AM.
     */
    public void generateMonthlySummary() {
        LocalDate lastMonth = LocalDate.now().minusMonths(1);
        logger.info("=== Generating monthly summary for {}/{} ===", lastMonth.getMonthValue(), lastMonth.getYear());
        try {
            monthlySummaryService.generateMonthlySummary(lastMonth.getMonthValue(), lastMonth.getYear());
            logger.info("Successfully generated monthly summary.");
        } catch (Exception e) {
            logger.error("Failed to generate monthly summary: {}", e.getMessage());
        }
    }
}
