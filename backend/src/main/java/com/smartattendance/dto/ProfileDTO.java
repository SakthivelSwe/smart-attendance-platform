package com.smartattendance.dto;

import com.smartattendance.enums.UserRole;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileDTO {
    private Long userId;
    private String email;
    private String name;
    private String avatarUrl;
    private UserRole role;

    // Employee Details
    private Long employeeId;
    private String employeeCode;
    private String phone;
    private String designation;

    // Team Details
    private Long teamId;
    private String teamName;
    private String teamLeadName;
    private String managerName;

    // Group Details
    private Long groupId;
    private String groupName;
}
