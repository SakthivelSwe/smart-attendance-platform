package com.smartattendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamComparisonDTO {
    private Long teamId;
    private String teamName;
    private int totalEmployees;
    private long totalPresent;
    private long totalAbsent;
    private long totalOnLeave;
    private double attendanceRate;
}
