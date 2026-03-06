package com.smartattendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private String type; // LEAVE | ATTENDANCE | INFO
    private String title;
    private String content;
    private String timeLabel; // e.g. "Just now", "2 hours ago"
    private String icon; // Material icon name
    private String color; // amber | rose | indigo | emerald
    private int count; // supporting number, e.g. 3 pending leaves
}
