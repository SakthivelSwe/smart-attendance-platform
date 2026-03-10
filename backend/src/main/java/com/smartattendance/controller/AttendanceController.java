package com.smartattendance.controller;

import com.smartattendance.dto.AttendanceDTO;
import com.smartattendance.entity.AttendanceGroup;
import com.smartattendance.entity.Employee;
import com.smartattendance.enums.AttendanceStatus;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.GroupRepository;
import com.smartattendance.service.AttendanceService;
import com.smartattendance.service.GmailService;
import com.smartattendance.service.GmailOAuthService;
import com.smartattendance.service.SystemSettingService;
import com.smartattendance.service.VcfContactMapService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceController.class);

    private final AttendanceService attendanceService;
    private final GmailService gmailService;
    private final GroupRepository groupRepository;
    private final EmployeeRepository employeeRepository;
    private final SystemSettingService systemSettingService;
    private final GmailOAuthService gmailOAuthService;
    private final VcfContactMapService vcfContactMapService;

    @GetMapping("/date/{date}")
    public ResponseEntity<List<AttendanceDTO>> getByDate(
            @PathVariable("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getAttendanceByDate(date));
    }

    @GetMapping("/team/{teamId}/date/{date}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<List<AttendanceDTO>> getByTeamAndDate(
            @PathVariable("teamId") Long teamId,
            @PathVariable("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getAttendanceByTeamAndDate(teamId, date));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AttendanceDTO>> getByEmployee(@PathVariable("employeeId") Long employeeId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByEmployee(employeeId));
    }

    @GetMapping("/range")
    public ResponseEntity<List<AttendanceDTO>> getByDateRange(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(attendanceService.getAttendanceByDateRange(start, end));
    }

    @GetMapping("/employee/{employeeId}/range")
    public ResponseEntity<List<AttendanceDTO>> getByEmployeeAndRange(
            @PathVariable("employeeId") Long employeeId,
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(attendanceService.getAttendanceByEmployeeAndDateRange(employeeId, start, end));
    }

    /**
     * Manually trigger attendance processing from pasted WhatsApp chat text.
     */
    @PostMapping("/process")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<AttendanceDTO>> processAttendance(@RequestBody Map<String, String> request) {
        String chatText = request.get("chatText");
        String dateStr = request.get("date");
        LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();
        boolean processFullHistory = request.getOrDefault("fullHistory", "true").equals("true");

        // Use 'true' by default for manual uploads to ensure corrections are applied
        List<AttendanceDTO> result = attendanceService.processWhatsAppAttendance(chatText, date, processFullHistory);
        return ResponseEntity.ok(result);
    }

    /**
     * Fetch WhatsApp chat from Gmail and process attendance automatically.
     * Admin provides Gmail email + App Password per-request (never stored on
     * server).
     */
    @PostMapping("/process-email")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> processFromEmail(@RequestBody Map<String, String> request) {
        String dateStr = request.get("date");
        String subjectPattern = request.get("subjectPattern");
        String gmailEmail = request.get("gmailEmail");
        String gmailPassword = request.get("gmailPassword");
        Long groupId = request.get("groupId") != null ? Long.parseLong(request.get("groupId")) : null;
        LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();

        Map<String, Object> response = new HashMap<>();

        // If frontend passes placeholder, fetch real password from DB
        if ("***SAVED_IN_DB***".equals(gmailPassword)) {
            String dbPass = systemSettingService.getGmailPassword();
            if (dbPass != null && !dbPass.isBlank()) {
                gmailPassword = dbPass;
            }
        }

        // Provide flexibility: Either OAuth2 is connected OR App Password is provided
        boolean isOAuthConnected = gmailOAuthService.isConnected();

        if (!isOAuthConnected) {
            // Need App password credentials
            if (gmailEmail == null || gmailEmail.isBlank() || gmailPassword == null || gmailPassword.isBlank()) {
                response.put("success", false);
                response.put("message",
                        "Gmail email and App Password are required. Please enter your credentials or connect via Google OAuth in Settings.");
                return ResponseEntity.badRequest().body(response);
            }
        }

        // If no subject pattern provided, use the group's pattern
        if ((subjectPattern == null || subjectPattern.isBlank()) && groupId != null) {
            AttendanceGroup group = groupRepository.findById(groupId).orElse(null);
            if (group != null && group.getEmailSubjectPattern() != null) {
                subjectPattern = group.getEmailSubjectPattern();
            }
        }

        // Default pattern if still empty
        if (subjectPattern == null || subjectPattern.isBlank()) {
            subjectPattern = "WhatsApp Chat";
        }

        logger.info("Fetching email with pattern '{}' for date {}. OAuth Connected: {}", subjectPattern, date,
                isOAuthConnected);

        String chatText = null;
        try {
            if (isOAuthConnected) {
                chatText = gmailOAuthService.fetchAttendanceEmailForDate(subjectPattern, date);
            } else {
                // Remove spaces from app password just in case user pasted 'aaaa bbbb cccc
                // dddd'
                String cleanPassword = gmailPassword.replace(" ", "").trim();
                chatText = gmailService.fetchAttendanceEmailForDate(gmailEmail, cleanPassword, subjectPattern, date);
            }
        } catch (jakarta.mail.AuthenticationFailedException authEx) {
            response.put("success", false);
            response.put("message", "Authentication Failed: Gmail rejected the login. Please check your App Password.");
            return ResponseEntity.badRequest().body(response);
        } catch (Exception ex) {
            response.put("success", false);
            response.put("message", "Error fetching email: " + ex.getMessage());
            return ResponseEntity.badRequest().body(response);
        }

        if (chatText == null || chatText.isBlank()) {
            response.put("success", false);
            response.put("message", "Connected successfully, but found 0 emails matching subject: \"" + subjectPattern
                    + "\" received on or after " + date
                    + ".\\nCheck if the email has arrived and the subject matches EXACTLY.");
            return ResponseEntity.ok(response);
        }

        // --- Auto-detect & process VCF from email (one-time setup, silent) ---
        if (groupId != null && !isOAuthConnected && gmailEmail != null && gmailPassword != null) {
            try {
                String cleanPasswordForVcf = gmailPassword.replace(" ", "").trim();
                byte[] vcfBytes = gmailService.fetchVcfAttachment(gmailEmail, cleanPasswordForVcf);
                if (vcfBytes != null) {
                    VcfContactMapService.VcfUploadResult vcfResult = vcfContactMapService.uploadAndFilter(groupId,
                            new java.io.ByteArrayInputStream(vcfBytes));
                    response.put("vcfUpdated", true);
                    response.put("vcfMessage", vcfResult.toMessage());
                    logger.info("VCF auto-processed from email for groupId={}: {}", groupId, vcfResult.toMessage());
                }
            } catch (Exception vcfEx) {
                // VCF failure is non-fatal — continue with chat processing
                logger.warn("VCF auto-fetch skipped: {}", vcfEx.getMessage());
            }
        }

        // Process the chat text
        List<AttendanceDTO> result = attendanceService.processWhatsAppAttendance(chatText, date, true);

        response.put("success", true);
        response.put("message", "Successfully processed " + result.size() + " attendance records from email.");
        response.put("attendance", result);
        return ResponseEntity.ok(response);
    }

    /**
     * Check Gmail connection and list recent matching emails.
     * Admin provides credentials per-request.
     */
    @PostMapping("/email-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getEmailStatus(@RequestBody Map<String, String> request) {
        String gmailEmail = request.get("gmailEmail");
        String gmailPassword = request.get("gmailPassword");
        String subjectPattern = request.getOrDefault("subjectPattern", "WhatsApp Chat");

        Map<String, Object> status = new HashMap<>();

        // If frontend passes placeholder, fetch real password from DB
        if ("***SAVED_IN_DB***".equals(gmailPassword)) {
            String dbPass = systemSettingService.getGmailPassword();
            if (dbPass != null && !dbPass.isBlank()) {
                gmailPassword = dbPass;
            }
        }

        boolean isOAuthConnected = gmailOAuthService.isConnected();

        if (!isOAuthConnected
                && (gmailEmail == null || gmailEmail.isBlank() || gmailPassword == null || gmailPassword.isBlank())) {
            status.put("configured", false);
            status.put("message",
                    "Please enter your Gmail email and App Password, or connect via Google OAuth in Settings.");
            return ResponseEntity.ok(status);
        }

        try {
            List<Map<String, String>> recentEmails;
            if (isOAuthConnected) {
                recentEmails = gmailOAuthService.listRecentEmails(subjectPattern, 5);
            } else {
                recentEmails = gmailService.listRecentEmails(gmailEmail, gmailPassword, subjectPattern, 5);
            }

            status.put("configured", true);
            status.put("connected", true);
            status.put("recentEmails", recentEmails);
            status.put("message", recentEmails.isEmpty()
                    ? "Connected! But no emails found matching: \"" + subjectPattern + "\""
                    : "Connected! Found " + recentEmails.size() + " recent emails");
        } catch (Exception e) {
            status.put("configured", true);
            status.put("connected", false);
            status.put("message", "Connection failed: " + e.getMessage());
        }

        return ResponseEntity.ok(status);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AttendanceDTO> updateAttendance(
            @PathVariable("id") Long id,
            @RequestBody AttendanceDTO dto) {
        return ResponseEntity.ok(attendanceService.updateAttendance(id, dto));
    }

    /**
     * Self check-in: authenticated user marks their own attendance.
     * Request body: { "status": "WFO", "remarks": "optional" }
     */
    @PostMapping("/check-in")
    public ResponseEntity<AttendanceDTO> checkIn(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String email = auth.getName();
        Employee employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> new com.smartattendance.exception.ResourceNotFoundException(
                        "Employee", "email", email));

        AttendanceStatus status = AttendanceStatus.valueOf(
                body.getOrDefault("status", "WFO").toUpperCase());
        String remarks = body.get("remarks");

        return ResponseEntity.ok(attendanceService.checkIn(employee.getId(), status, remarks));
    }
}
