package com.smartattendance.dto;

import com.smartattendance.enums.AttendanceStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private LocalDate date;
    private LocalTime inTime;
    private LocalTime outTime;
    private AttendanceStatus status;
    private String source;
    private String remarks;
    private String groupName;
}
