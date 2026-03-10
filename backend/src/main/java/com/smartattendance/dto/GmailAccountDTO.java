package com.smartattendance.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GmailAccountDTO {
    private Long id;
    private Long groupId;
    private String groupName;
    private String email;
    private String authMethod;
    private boolean isActive;
    private String status; // e.g. "Connected", "Not Connected"
}
