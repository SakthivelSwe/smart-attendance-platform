package com.smartattendance.dto;

import lombok.Data;

@Data
public class AutomationSettingsDTO {
    private boolean emailReminderEnabled;
    private boolean whatsappReminderEnabled;
    private String reminderTime;
    private String processingTime;
}
