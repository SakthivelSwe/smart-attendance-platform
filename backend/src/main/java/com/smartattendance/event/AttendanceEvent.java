package com.smartattendance.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDate;

/**
 * Base class for all attendance-related events.
 */
@Getter
public abstract class AttendanceEvent extends ApplicationEvent {
    private final LocalDate date;

    protected AttendanceEvent(Object source, LocalDate date) {
        super(source);
        this.date = date;
    }
}
