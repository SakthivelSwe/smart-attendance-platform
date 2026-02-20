package com.smartattendance.controller;

import com.smartattendance.dto.GmailCredentialsDTO;
import com.smartattendance.dto.WhatsAppCredentialsDTO;
import com.smartattendance.service.EmailNotificationService;
import com.smartattendance.service.SystemSettingService;
import com.smartattendance.service.WhatsAppNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SystemSettingController {

    private final SystemSettingService systemSettingService;
    private final EmailNotificationService emailNotificationService;
    private final WhatsAppNotificationService whatsAppNotificationService;

    @PostMapping("/gmail")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> saveGmailCredentials(@RequestBody GmailCredentialsDTO dto) {
        systemSettingService.saveGmailCredentials(dto.getEmail(), dto.getAppPassword());
        return ResponseEntity.ok(Map.of("message", "Gmail credentials saved successfully"));
    }

    @GetMapping("/gmail/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getGmailStatus() {
        String email = systemSettingService.getGmailEmail();
        return ResponseEntity.ok(Map.of(
                "configured", email != null,
                "email", email != null ? email : ""));
    }

    @PostMapping("/test-email")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> testEmail(@RequestBody Map<String, String> payload) {
        String testEmail = payload.get("email");
        if (testEmail == null || testEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        emailNotificationService.sendReminderToAdmin(testEmail);
        return ResponseEntity.ok(Map.of("message", "Test email triggered to " + testEmail));
    }

    @PostMapping("/whatsapp")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> saveWhatsAppCredentials(@RequestBody WhatsAppCredentialsDTO dto) {
        systemSettingService.saveWhatsAppCredentials(dto.getAdminPhone(), dto.getApiKey());
        return ResponseEntity.ok(Map.of("message", "WhatsApp credentials saved successfully"));
    }

    @GetMapping("/whatsapp/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getWhatsAppStatus() {
        String phone = systemSettingService.getAdminWhatsAppPhone();
        String apiKey = systemSettingService.getWhatsAppApiKey();
        return ResponseEntity.ok(Map.of(
                "configured", (phone != null && apiKey != null),
                "adminPhone", phone != null ? phone : ""));
    }

    @PostMapping("/whatsapp/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> testWhatsApp() {
        whatsAppNotificationService.sendWhatsAppMessage("Test Notification from Smart Attendance App");
        return ResponseEntity.ok(Map.of("message", "Test WhatsApp notification triggered via CallMeBot"));
    }
}
