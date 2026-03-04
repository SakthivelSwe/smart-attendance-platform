package com.smartattendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeReportCardDTO {
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private String teamName;
    private long totalWorkingDays;
    private long totalPresent;
    private long totalAbsent;
    private long totalOnLeave;
    private long wfhDays;
    private double attendanceRate;
}
