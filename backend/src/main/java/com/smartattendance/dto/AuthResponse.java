package com.smartattendance.dto;

import com.smartattendance.enums.UserRole;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String email;
    private String name;
    private String avatarUrl;
    private UserRole role;
    private Long userId;
}
