package com.smartattendance.controller;

import com.smartattendance.dto.GmailCredentialsDTO;
import com.smartattendance.dto.AutomationSettingsDTO;
import com.smartattendance.dto.WhatsAppCredentialsDTO;
import com.smartattendance.service.AttendanceScheduler;
import com.smartattendance.service.EmailNotificationService;
import com.smartattendance.service.GmailOAuthService;
import com.smartattendance.service.SystemSettingService;
import com.smartattendance.service.WhatsAppNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SystemSettingController {

    private final SystemSettingService systemSettingService;
    private final EmailNotificationService emailNotificationService;
    private final WhatsAppNotificationService whatsAppNotificationService;
    private final AttendanceScheduler attendanceScheduler;
    private final GmailOAuthService gmailOAuthService;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

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
        // Check if mail is configured at all (either App Password or OAuth2)
        boolean hasAppPassword = systemSettingService.getGmailEmail() != null
                && systemSettingService.getGmailPassword() != null;
        boolean hasOAuth2 = false;
        try {
            hasOAuth2 = systemSettingService.getOAuthConnectedEmail() != null
                    && systemSettingService.getOAuthRefreshToken() != null;
        } catch (Exception e) {
        } // In case getting it throws

        if (!hasAppPassword && !hasOAuth2) {
            return ResponseEntity.status(500)
                    .body(Map.of("error",
                            "Failed: Gmail credentials not configured or corrupted. Please click 'Change Credentials' and re-save your App Password, or connect via Google OAuth2."));
        }
        try {
            emailNotificationService.sendReminderToAdmin(testEmail);
            return ResponseEntity.ok(Map.of("message", "Test email triggered to " + testEmail));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "SMTP Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/gmail")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> clearGmailCredentials() {
        systemSettingService.clearGmailCredentials();
        return ResponseEntity.ok(Map.of("message", "Gmail credentials cleared. Please re-save your credentials."));
    }

    // -----------------------------------------------------------------------
    // Gmail OAuth2 — Connect / Disconnect / Callback
    // -----------------------------------------------------------------------

    /**
     * Step 1: Frontend calls this to get the Google authorization URL.
     * The admin is then redirected to that URL in the browser.
     */
    @GetMapping("/gmail/oauth/authorize")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> getOAuthAuthorizationUrl() {
        String authUrl = gmailOAuthService.buildAuthorizationUrl();
        return ResponseEntity.ok(Map.of("authUrl", authUrl));
    }

    /**
     * Step 2: Google redirects back here with the authorization code.
     * We exchange it for tokens, save them, and redirect the admin back to the
     * frontend settings page.
     */
    @GetMapping("/gmail/oauth/callback")
    public ResponseEntity<Void> handleOAuthCallback(
            @RequestParam("code") String code,
            @RequestParam(name = "state", required = false) String state,
            @RequestParam(name = "error", required = false) String error) {
        String frontendRedirect;
        if (error != null) {
            frontendRedirect = frontendUrl + "/settings?gmail_oauth=error&reason="
                    + encodeParam(error);
        } else {
            try {
                String email = gmailOAuthService.handleOAuthCallback(code, state, null);
                frontendRedirect = frontendUrl + "/settings?gmail_oauth=success&email="
                        + encodeParam(email);
            } catch (Exception e) {
                frontendRedirect = frontendUrl + "/settings?gmail_oauth=error&reason="
                        + encodeParam(e.getMessage() != null ? e.getMessage() : "unknown");
            }
        }
        HttpHeaders headers = new HttpHeaders();
        // Use setLocation with URI to let Spring handle header encoding safely
        try {
            headers.setLocation(java.net.URI.create(frontendRedirect));
        } catch (Exception e) {
            headers.setLocation(
                    java.net.URI.create(frontendUrl + "/settings?gmail_oauth=error&reason=callback_failed"));
        }
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    /** URL-encodes a value for safe use in a query parameter, also strips CR/LF. */
    private String encodeParam(String value) {
        if (value == null)
            return "";
        // Strip CR/LF first to prevent header injection
        String safe = value.replaceAll("[\\r\\n]", " ");
        return java.net.URLEncoder.encode(safe, java.nio.charset.StandardCharsets.UTF_8);
    }

    /**
     * Returns the OAuth2 connection status (connected email or null).
     */
    @GetMapping("/gmail/oauth/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getOAuthStatus() {
        boolean connected = gmailOAuthService.isConnected();
        String email = gmailOAuthService.getConnectedEmail();
        return ResponseEntity.ok(Map.of(
                "connected", connected,
                "email", email != null ? email : "",
                "method", connected ? "oauth2" : "app_password"));
    }

    /**
     * Disconnect the OAuth2 Gmail account (removes stored refresh token).
     */
    @DeleteMapping("/gmail/oauth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> disconnectOAuth() {
        gmailOAuthService.disconnect();
        return ResponseEntity.ok(Map.of("message", "Gmail account disconnected successfully."));
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

    @GetMapping("/automation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AutomationSettingsDTO> getAutomationSettings() {
        AutomationSettingsDTO dto = new AutomationSettingsDTO();
        dto.setEmailReminderEnabled(systemSettingService.isEmailReminderEnabled());
        dto.setWhatsappReminderEnabled(systemSettingService.isWhatsAppReminderEnabled());
        dto.setReminderTime(systemSettingService.getSchedulerReminderTime());
        dto.setProcessingTime(systemSettingService.getSchedulerProcessingTime());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/automation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> saveAutomationSettings(@RequestBody AutomationSettingsDTO dto) {
        systemSettingService.saveAutomationSettings(
                dto.isEmailReminderEnabled(),
                dto.isWhatsappReminderEnabled(),
                dto.getReminderTime(),
                dto.getProcessingTime());
        attendanceScheduler.rescheduleJobs();
        return ResponseEntity.ok(Map.of("message", "Automation settings saved successfully"));
    }

    @PostMapping("/automation/trigger-reminder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> triggerReminder() {
        attendanceScheduler.checkImportStatus();
        return ResponseEntity.ok(Map.of("message", "Manual reminder check triggered"));
    }

    @PostMapping("/automation/force-reminder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> forceReminder() {
        String email = systemSettingService.getGmailEmail();
        String password = systemSettingService.getGmailPassword();
        if (email == null || password == null) {
            return ResponseEntity.status(500).body(Map.of("error", "Gmail credentials not configured."));
        }
        try {
            emailNotificationService.sendReminderToAdmin(email);
            return ResponseEntity.ok(Map.of("message", "Reminder email sent to " + email));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "SMTP Error: " + e.getMessage()));
        }
    }

    @GetMapping("/diagnose-email")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> diagnoseEmail() {
        String email = systemSettingService.getGmailEmail();
        String password = systemSettingService.getGmailPassword();
        String passwordHint = (password != null && password.length() >= 4)
                ? password.substring(0, 4) + "****" + " (length=" + password.length() + ")"
                : "(null or empty)";

        // Also surface OAuth2 status
        boolean oauthConnected = gmailOAuthService.isConnected();
        String oauthEmail = gmailOAuthService.getConnectedEmail();
        String oauthToken = systemSettingService.getOAuthRefreshToken();

        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("smtpEmail", email != null ? email : "NOT_SET");
        result.put("smtpPasswordHint", passwordHint);
        result.put("smtpPasswordLength", password != null ? password.length() : 0);
        result.put("oauth2Connected", oauthConnected);
        result.put("oauth2Email", oauthEmail != null ? oauthEmail : "NOT_SET");
        result.put("oauth2TokenPresent", oauthToken != null && !oauthToken.isBlank());
        result.put("hint",
                !oauthConnected
                        ? "OAuth2 not connected. Go to Settings > Connect Gmail Account."
                        : "OAuth2 connected. If you see 'invalid_grant' in logs, the token expired — reconnect Gmail.");
        return ResponseEntity.ok(result);
    }

    /**
     * Perform a live validation of the stored OAuth2 token by attempting a
     * simple Gmail API call (list 1 email).
     * Useful after deployment to verify the token is still valid.
     */
    @PostMapping("/diagnose-email/validate-oauth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> validateOAuthToken() {
        if (!gmailOAuthService.isConnected()) {
            return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "message", "No OAuth2 account connected. Please connect Gmail in Settings."));
        }
        boolean valid = gmailOAuthService.hasAttendanceEmailForDate("WhatsApp", java.time.LocalDate.now());
        String email = gmailOAuthService.getConnectedEmail();
        return ResponseEntity.ok(Map.of(
                "valid", valid,
                "connectedEmail", email != null ? email : "",
                "message", valid
                        ? "OAuth2 token is valid. Gmail API call succeeded."
                        : "OAuth2 token is INVALID (invalid_grant or network error). Token has been auto-cleared. Please reconnect Gmail in Settings."));
    }
}
