package com.smartattendance.dto;

import com.smartattendance.enums.UserRole;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String email;
    private String name;
    private String avatarUrl;
    private UserRole role;
    private Boolean isActive;
    private Boolean emailVerified;
    private Long teamId;
    private String teamName;
}
