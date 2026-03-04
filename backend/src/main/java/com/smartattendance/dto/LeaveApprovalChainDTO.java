package com.smartattendance.dto;

import com.smartattendance.enums.LeaveStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveApprovalChainDTO {
    private Long id;
    private Long leaveId;
    private Long approverId;
    private String approverName;
    private String approverRole;
    private LeaveStatus action;
    private String remarks;
    private LocalDateTime createdAt;
}
