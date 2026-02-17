package com.smartattendance.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {
    private long totalEmployees;
    private long presentToday;
    private long wfoToday;
    private long wfhToday;
    private long onLeaveToday;
    private long absentToday;
    private long pendingLeaves;
    private long upcomingHolidays;
}
