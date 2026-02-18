package com.smartattendance.controller;

import com.smartattendance.dto.GmailCredentialsDTO;
import com.smartattendance.service.SystemSettingService;
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
}
