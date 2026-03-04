package com.smartattendance.event;

import lombok.Getter;

import java.time.LocalDate;

/**
 * Published after daily attendance processing completes.
 * Listeners can send team summaries, absence alerts, etc.
 */
@Getter
public class DailyAttendanceProcessedEvent extends AttendanceEvent {
    private final int totalProcessed;

    public DailyAttendanceProcessedEvent(Object source, LocalDate date, int totalProcessed) {
        super(source, date);
        this.totalProcessed = totalProcessed;
    }
}
