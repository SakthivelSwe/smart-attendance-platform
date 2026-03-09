package com.smartattendance.controller;

import com.smartattendance.dto.AttendanceDTO;
import com.smartattendance.dto.WhatsAppImportRecordDTO;
import com.smartattendance.service.WhatsAppImportService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for WhatsApp Attendance Import feature.
 *
 * Endpoints:
 *   POST /api/import/vcf              - Upload VCF contacts file (one-time setup per group)
 *   GET  /api/import/vcf/status       - Check if VCF is loaded for a group
 *   POST /api/import/whatsapp/preview - Parse WhatsApp export, return preview (no save)
 *   POST /api/import/whatsapp/confirm - Save confirmed attendance records
 */
@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class WhatsAppImportController {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppImportController.class);

    private final WhatsAppImportService whatsAppImportService;

    // =========================================================================
    // VCF Upload — One-time setup
    // =========================================================================

    /**
     * Upload a VCF contacts file for a specific attendance group.
     * This is done ONCE per group. The system stores the name->phone mappings
     * so they can be used automatically for every future WhatsApp export import.
     *
     * Request: multipart/form-data with fields:
     *   - file: the .vcf file
     *   - groupId: the attendance group ID
     */
    @PostMapping("/vcf")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<Map<String, Object>> uploadVcf(
            @RequestParam("file") MultipartFile file,
            @RequestParam("groupId") Long groupId) {

        Map<String, Object> response = new HashMap<>();

        if (file.isEmpty()) {
            response.put("success", false);
            response.put("message", "Please upload a valid .vcf file.");
            return ResponseEntity.badRequest().body(response);
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".vcf")) {
            response.put("success", false);
            response.put("message", "Invalid file type. Please upload a .vcf (vCard) contacts file.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            int count = whatsAppImportService.uploadVcf(groupId, file.getInputStream());
            response.put("success", true);
            response.put("contactsLoaded", count);
            response.put("message", count + " contacts loaded successfully! You can now import WhatsApp attendance exports.");
            logger.info("VCF uploaded for groupId={}: {} contacts loaded", groupId, count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("VCF upload failed for groupId={}: {}", groupId, e.getMessage());
            response.put("success", false);
            response.put("message", "Failed to process VCF file: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Check how many contacts are loaded for a group's contact map.
     * Used by the UI to show "Contact Map: Loaded (247 contacts)" status.
     */
    @GetMapping("/vcf/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<Map<String, Object>> getVcfStatus(@RequestParam("groupId") Long groupId) {
        long count = whatsAppImportService.getContactMapCount(groupId);
        Map<String, Object> response = new HashMap<>();
        response.put("loaded", count > 0);
        response.put("contactCount", count);
        response.put("message", count > 0
                ? count + " contacts loaded. Ready to import WhatsApp chats."
                : "No contacts loaded yet. Please upload your contacts.vcf file first.");
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // WhatsApp Export Import — Regular usage (every day/week)
    // =========================================================================

    /**
     * Parse a WhatsApp export file and return a preview of resolved attendance records.
     * Does NOT save to the database — the user must confirm via /confirm endpoint.
     *
     * Request: multipart/form-data with fields:
     *   - file: the WhatsApp export .txt file  (OR)
     *   - chatText: raw chat text as a string
     *   - groupId: the attendance group ID
     */
    @PostMapping("/whatsapp/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<Map<String, Object>> previewImport(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "chatText", required = false) String chatText,
            @RequestParam("groupId") Long groupId) {

        Map<String, Object> response = new HashMap<>();

        try {
            String text = chatText;

            // If file is provided, read text from it
            if (file != null && !file.isEmpty()) {
                text = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
                // Handle UTF-8 BOM (WhatsApp sometimes adds it)
                if (text.startsWith("\uFEFF")) {
                    text = text.substring(1);
                }
            }

            if (text == null || text.isBlank()) {
                response.put("success", false);
                response.put("message", "Please upload a WhatsApp export .txt file or paste the chat text.");
                return ResponseEntity.badRequest().body(response);
            }

            long vcfCount = whatsAppImportService.getContactMapCount(groupId);
            if (vcfCount == 0) {
                response.put("success", false);
                response.put("message", "No contact map found for this group. Please upload your contacts.vcf file first (one-time setup).");
                return ResponseEntity.badRequest().body(response);
            }

            List<WhatsAppImportRecordDTO> records = whatsAppImportService.previewImport(groupId, text);

            long matched = records.stream().filter(WhatsAppImportRecordDTO::isMatched).count();
            long unmatched = records.size() - matched;

            response.put("success", true);
            response.put("records", records);
            response.put("totalRecords", records.size());
            response.put("matchedRecords", matched);
            response.put("unmatchedRecords", unmatched);
            response.put("message", matched + " records matched, " + unmatched + " unmatched.");
            response.put("vcfContactsLoaded", vcfCount);

            logger.info("WhatsApp import preview for groupId={}: {} total, {} matched, {} unmatched",
                    groupId, records.size(), matched, unmatched);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("WhatsApp import preview failed for groupId={}: {}", groupId, e.getMessage());
            response.put("success", false);
            response.put("message", "Failed to parse WhatsApp export: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Confirm and save the attendance records selected by the user from the preview.
     *
     * Request body: JSON array of WhatsAppImportRecordDTO objects with employeeId populated.
     * Only records with a non-null employeeId will be saved.
     */
    @PostMapping("/whatsapp/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<Map<String, Object>> confirmImport(
            @RequestBody List<WhatsAppImportRecordDTO> records) {

        Map<String, Object> response = new HashMap<>();

        if (records == null || records.isEmpty()) {
            response.put("success", false);
            response.put("message", "No records to save.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            List<AttendanceDTO> saved = whatsAppImportService.confirmImport(records);
            response.put("success", true);
            response.put("savedCount", saved.size());
            response.put("attendance", saved);
            response.put("message", saved.size() + " attendance records saved successfully!");
            logger.info("WhatsApp import confirmed: {} records saved.", saved.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("WhatsApp import confirm failed: {}", e.getMessage());
            response.put("success", false);
            response.put("message", "Failed to save attendance records: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
