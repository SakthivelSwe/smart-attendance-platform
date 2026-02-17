package com.smartattendance.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlySummaryDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private String groupName;
    private Integer month;
    private Integer year;
    private Integer wfoCount;
    private Integer wfhCount;
    private Integer leaveCount;
    private Integer holidayCount;
    private Integer absentCount;
    private Integer totalWorkingDays;
    private Double attendancePercentage;
}
