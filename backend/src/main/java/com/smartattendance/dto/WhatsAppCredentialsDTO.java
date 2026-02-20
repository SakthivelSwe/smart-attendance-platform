package com.smartattendance.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhatsAppCredentialsDTO {
    private String adminPhone; // The phone number to send reminders to
    private String apiKey; // The API key (e.g. CallMeBot API Key)
}
