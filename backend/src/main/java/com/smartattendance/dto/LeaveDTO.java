package com.smartattendance.dto;

import com.smartattendance.enums.LeaveStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String leaveType;
    private LeaveStatus status;
    private Long approvedBy;
    private String approvedByName;
    private String adminRemarks;
}
