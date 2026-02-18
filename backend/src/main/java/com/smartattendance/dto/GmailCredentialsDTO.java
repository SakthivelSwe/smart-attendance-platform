package com.smartattendance.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GmailCredentialsDTO {
    private String email;
    private String appPassword;
}
