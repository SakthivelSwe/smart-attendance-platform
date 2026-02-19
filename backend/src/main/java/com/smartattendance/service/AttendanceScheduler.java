package com.smartattendance.service;

import com.smartattendance.dto.AttendanceDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AttendanceScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceScheduler.class);

    private final AttendanceService attendanceService;
    private final EmailNotificationService emailNotificationService;
    private final SystemSettingService systemSettingService;
    private final GmailService gmailService;

    /**
     * Weekday morning processing - Monday to Friday at 6:00 AM IST.
     */
    @Scheduled(cron = "0 0 12 * * MON-FRI", zone = "Asia/Kolkata")
    public void processWeekdays() {
        logger.info("=== Starting scheduled Weekday Morning attendance processing (6 AM) ===");
        runAutomaticProcess();
    }

    /**
     * Saturday evening processing - Saturdays at 7:00 PM IST.
     */
    @Scheduled(cron = "0 0 19 * * SAT", zone = "Asia/Kolkata")
    public void processSaturday() {
        logger.info("=== Starting scheduled Saturday Evening attendance processing (7 PM) ===");
        runAutomaticProcess();
    }

    private void runAutomaticProcess() {
        LocalDate today = LocalDate.now();
        String email = systemSettingService.getGmailEmail();
        String password = systemSettingService.getGmailPassword();

        if (email == null || password == null) {
            logger.warn("Automatic processing skipped: Gmail credentials not configured in System Settings.");
            return;
        }

        try {
            logger.info("Automatically fetching WhatsApp attendance for {}", today);
            // Default subject pattern for WhatsApp exports
            String subjectPattern = "WhatsApp Chat with %";

            String chatText = gmailService.fetchAttendanceEmailForDate(email, password, subjectPattern, today);

            if (chatText != null && !chatText.isBlank()) {
                attendanceService.processWhatsAppAttendance(chatText, today);
                logger.info("Automatically processed attendance from email for {}", today);
            } else {
                logger.info("No attendance email found for {}", today);
            }

            // Send daily summary email
            List<AttendanceDTO> todayAttendance = attendanceService.getAttendanceByDate(today);
            if (!todayAttendance.isEmpty()) {
                try {
                    emailNotificationService.sendDailySummaryEmail(todayAttendance, today, email);
                } catch (Exception ex) {
                    logger.warn("Failed to send daily summary email: {}", ex.getMessage());
                }
            }

        } catch (Exception e) {
            logger.error("Error in automatic attendance processing: {}", e.getMessage(), e);
        }
    }

    /**
     * Monthly summary generation - runs on the 1st of every month at 6 AM.
     */
    @Scheduled(cron = "0 0 6 1 * *", zone = "Asia/Kolkata")
    public void generateMonthlySummary() {
        logger.info("=== Generating monthly summary ===");
        LocalDate lastMonth = LocalDate.now().minusMonths(1);
        logger.info("Monthly summary generation triggered for {}/{}", lastMonth.getMonthValue(), lastMonth.getYear());
    }
}
