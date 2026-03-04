package com.smartattendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamDTO {
    private Long id;

    @NotBlank(message = "Team name is required")
    private String name;

    private String teamCode;
    private String description;

    private Long teamLeadId;
    private String teamLeadName;
    private String teamLeadEmail;

    private Long managerId;
    private String managerName;
    private String managerEmail;

    private String emailAlias;

    @JsonProperty("isActive")
    private Boolean isActive;

    private Long employeeCount;
}
