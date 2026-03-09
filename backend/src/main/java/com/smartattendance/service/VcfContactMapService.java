package com.smartattendance.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Parses a VCF (vCard) file exported from a phone's contact book.
 * Builds a map of: savedName -> phoneNumber
 *
 * This allows the system to resolve WhatsApp display names (which are
 * the names you saved in your phone) back to raw phone numbers,
 * which can then be matched to employees by their phone field.
 *
 * One-time setup: the manager exports contacts.vcf from their Android/iPhone
 * once, uploads it to the platform. The resulting map is cached in the DB
 * (ContactMapEntry table) and reused for all future WhatsApp imports.
 */
@Service
public class VcfContactMapService {

    private static final Logger logger = LoggerFactory.getLogger(VcfContactMapService.class);

    /**
     * Parse a VCF file stream and return a map of displayName -> normalizedPhone.
     *
     * @param inputStream the raw .vcf file content
     * @return map where key = contact saved name, value = 10-digit phone number
     */
    public Map<String, String> parseVcf(InputStream inputStream) throws IOException {
        Map<String, String> nameToPhone = new HashMap<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String currentName = null;
            String currentPhone = null;

            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();

                if (line.startsWith("FN:")) {
                    // Full Name field — the display name you saved
                    currentName = line.substring(3).trim();
                } else if (line.startsWith("N:") && currentName == null) {
                    // Fallback: structured name field (Last;First;Middle;Prefix;Suffix)
                    String[] parts = line.substring(2).split(";");
                    StringBuilder nameBuilder = new StringBuilder();
                    for (String part : parts) {
                        String p = part.trim();
                        if (!p.isEmpty()) {
                            if (nameBuilder.length() > 0) nameBuilder.append(" ");
                            nameBuilder.append(p);
                        }
                    }
                    if (nameBuilder.length() > 0) {
                        currentName = nameBuilder.toString().trim();
                    }
                } else if (line.startsWith("TEL") && line.contains(":")) {
                    // TEL field (can have params like TEL;TYPE=CELL:+919876543210)
                    int colonIdx = line.indexOf(':');
                    if (colonIdx >= 0) {
                        String phoneRaw = line.substring(colonIdx + 1).trim();
                        String normalized = normalizePhone(phoneRaw);
                        if (normalized.length() >= 7) {
                            // Prefer the first phone found for this contact
                            if (currentPhone == null) {
                                currentPhone = normalized;
                            }
                        }
                    }
                } else if (line.equalsIgnoreCase("END:VCARD")) {
                    // End of a vCard entry — save if we have both name and phone
                    if (currentName != null && !currentName.isBlank() && currentPhone != null) {
                        nameToPhone.put(currentName.trim(), currentPhone);
                        logger.debug("VCF mapped: '{}' -> '{}'", currentName.trim(), currentPhone);
                    }
                    currentName = null;
                    currentPhone = null;
                }
            }
        }

        logger.info("VCF parsing complete. {} contacts loaded.", nameToPhone.size());
        return nameToPhone;
    }

    /**
     * Normalize a phone number to digits only, stripping country code if Indian (+91).
     * Returns 10-digit mobile number for Indian numbers, or full digits for others.
     */
    public String normalizePhone(String raw) {
        if (raw == null) return "";
        // Remove all non-digit characters
        String digits = raw.replaceAll("[^0-9]", "");
        // Strip Indian country code: +91
        if (digits.length() > 10 && digits.startsWith("91")) {
            return digits.substring(2);
        }
        // Strip leading 0 (local format)
        if (digits.length() == 11 && digits.startsWith("0")) {
            return digits.substring(1);
        }
        return digits;
    }
}
