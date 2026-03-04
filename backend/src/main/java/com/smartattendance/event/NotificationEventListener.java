package com.smartattendance.event;

import com.smartattendance.service.NotificationEngineService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listens for attendance events and triggers notifications.
 * Decouples attendance processing from notification sending.
 */
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private static final Logger logger = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationEngineService notificationEngineService;

    @Async
    @EventListener
    public void onDailyAttendanceProcessed(DailyAttendanceProcessedEvent event) {
        logger.info("Received DailyAttendanceProcessedEvent for date {} ({} records)",
                event.getDate(), event.getTotalProcessed());

        try {
            notificationEngineService.triggerAllDailyNotifications(event.getDate());
        } catch (Exception e) {
            logger.error("Error processing notification event: {}", e.getMessage(), e);
        }
    }
}
