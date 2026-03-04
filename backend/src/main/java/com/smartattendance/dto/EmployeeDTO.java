package com.smartattendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDTO {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String phone;
    private String whatsappName;
    private String employeeCode;
    private Long groupId;
    private String groupName;
    private Long teamId;
    private String teamName;
    private String designation;

    @JsonProperty("isActive")
    private Boolean isActive;
}
