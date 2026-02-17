package com.smartattendance.service;

import com.smartattendance.dto.AttendanceDTO;
import com.smartattendance.entity.AttendanceGroup;
import com.smartattendance.repository.GroupRepository;
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

    private final GmailService gmailService;
    private final AttendanceService attendanceService;
    private final EmailNotificationService emailNotificationService;
    private final GroupRepository groupRepository;

    /**
     * Daily scheduled job to process attendance.
     * Runs at 7:00 PM IST every day (Mon-Sat).
     */
    @Scheduled(cron = "0 0 19 * * MON-SAT", zone = "Asia/Kolkata")
    public void processDaily() {
        logger.info("=== Starting scheduled daily attendance processing ===");
        LocalDate today = LocalDate.now();

        try {
            if (gmailService.isConfigured()) {
                // Auto-process from Gmail for each active group
                List<AttendanceGroup> groups = groupRepository.findByIsActiveTrue();
                for (AttendanceGroup group : groups) {
                    try {
                        String chatText = gmailService.fetchLatestAttendanceEmail(
                                group.getEmailSubjectPattern());
                        if (chatText != null) {
                            attendanceService.processWhatsAppAttendance(chatText, today);
                            logger.info("Processed attendance for group: {}", group.getName());
                        }
                    } catch (Exception e) {
                        logger.error("Error processing group {}: {}", group.getName(), e.getMessage());
                    }
                }
            } else {
                logger.info("Gmail not configured. Waiting for manual processing.");
            }

            // Send daily summary email
            List<AttendanceDTO> todayAttendance = attendanceService.getAttendanceByDate(today);
            if (!todayAttendance.isEmpty()) {
                try {
                    emailNotificationService.sendDailySummaryEmail(todayAttendance, today, "admin@smartattendance.com");
                } catch (Exception ex) {
                    logger.warn("Failed to send daily summary email: {}", ex.getMessage());
                }
                logger.info("Daily attendance processed: {} records for {}", todayAttendance.size(), today);
            }

        } catch (Exception e) {
            logger.error("Error in daily attendance processing: {}", e.getMessage(), e);
        }

        logger.info("=== Daily attendance processing completed ===");
    }

    /**
     * Monthly summary generation - runs on the 1st of every month at 6 AM.
     */
    @Scheduled(cron = "0 0 6 1 * *", zone = "Asia/Kolkata")
    public void generateMonthlySummary() {
        logger.info("=== Generating monthly summary ===");
        LocalDate lastMonth = LocalDate.now().minusMonths(1);
        // Monthly summary generation would be triggered here
        logger.info("Monthly summary generation triggered for {}/{}", lastMonth.getMonthValue(), lastMonth.getYear());
    }
}
