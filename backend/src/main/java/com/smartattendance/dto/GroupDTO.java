package com.smartattendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupDTO {
    private Long id;

    @NotBlank(message = "Group name is required")
    private String name;

    private String whatsappGroupName;
    private String emailSubjectPattern;
    private String googleSheetId;

    @JsonProperty("isActive")
    private Boolean isActive;
    private Long employeeCount;
}
