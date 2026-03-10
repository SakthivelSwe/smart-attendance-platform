package com.smartattendance.service;

import com.smartattendance.entity.ContactMapEntry;
import com.smartattendance.entity.AttendanceGroup;
import com.smartattendance.entity.Employee;
import com.smartattendance.repository.ContactMapRepository;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Handles VCF contact file parsing and upload with two key privacy features:
 *
 * 1. FILTER-AT-UPLOAD: Only stores contacts whose phone number matches a
 * registered
 * employee in the group. Personal contacts (family, friends) are discarded
 * immediately
 * and never written to the database.
 *
 * 2. ENCRYPTION AT REST: Stored phone numbers are AES-256-GCM encrypted so raw
 * personal numbers cannot be read even if the DB is accessed directly.
 */
@Service
@RequiredArgsConstructor
public class VcfContactMapService {

    private static final Logger logger = LoggerFactory.getLogger(VcfContactMapService.class);

    private final ContactMapRepository contactMapRepository;
    private final EmployeeRepository employeeRepository;
    private final GroupRepository groupRepository;
    private final EncryptionService encryptionService;

    /**
     * Parses a VCF file, filters to only matched employees, encrypts phones, saves
     * to DB.
     *
     * @param groupId     the attendance group
     * @param inputStream raw .vcf file content
     * @return stats: { totalParsed, matched, discarded }
     */
    @Transactional
    public VcfUploadResult uploadAndFilter(Long groupId, InputStream inputStream) throws IOException {
        AttendanceGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Attendance group not found: " + groupId));

        // Step 1: Parse the VCF into a raw name -> phone map (all 600 contacts, in
        // memory only)
        Map<String, String> rawNameToPhone = parseVcfRaw(inputStream);
        int totalParsed = rawNameToPhone.size();

        // Step 2: Load employees for this group to use as the filter
        List<Employee> groupEmployees = employeeRepository.findByIsActiveTrueWithGroup()
                .stream()
                .filter(e -> e.getGroup() != null && e.getGroup().getId().equals(groupId))
                .toList();

        // Build a normalized phone -> employee map for cross-matching
        Map<String, Employee> empPhoneMap = new HashMap<>();
        for (Employee e : groupEmployees) {
            if (e.getPhone() != null && !e.getPhone().isBlank()) {
                empPhoneMap.put(normalizePhone(e.getPhone()), e);
            }
        }

        // Step 3: Filter — only keep VCF contacts that match an employee's phone
        List<ContactMapEntry> toSave = new ArrayList<>();
        int matched = 0;

        for (Map.Entry<String, String> vcfEntry : rawNameToPhone.entrySet()) {
            String displayName = vcfEntry.getKey();
            String normalizedPhone = vcfEntry.getValue(); // already normalized by parseVcfRaw

            Employee matchedEmployee = empPhoneMap.get(normalizedPhone);
            if (matchedEmployee != null) {
                // Encrypt the phone number before storing
                String encryptedPhone = encryptionService.encrypt(normalizedPhone);
                toSave.add(ContactMapEntry.builder()
                        .group(group)
                        .displayName(displayName)
                        .phoneNumber(encryptedPhone) // stored encrypted
                        .build());
                matched++;
                logger.debug("VCF match: '{}' -> {} (employee: {})", displayName, normalizedPhone,
                        matchedEmployee.getName());
            }
            // else: personal contact — silently discarded, never written to DB
        }

        int discarded = totalParsed - matched;
        logger.info("VCF upload for group '{}': {} total parsed, {} matched employees, {} personal contacts discarded.",
                group.getName(), totalParsed, matched, discarded);

        // Step 4: Replace old entries for this group with fresh filtered set
        contactMapRepository.deleteByGroupId(groupId);
        contactMapRepository.saveAll(toSave);

        return new VcfUploadResult(totalParsed, matched, discarded);
    }

    /**
     * Load and decrypt the contact map for a group.
     * 
     * @return displayName -> decrypted phone number
     */
    public Map<String, String> loadDecryptedMap(Long groupId) {
        List<ContactMapEntry> entries = contactMapRepository.findByGroupId(groupId);
        Map<String, String> map = new HashMap<>();
        for (ContactMapEntry e : entries) {
            String decrypted = encryptionService.decrypt(e.getPhoneNumber());
            map.put(e.getDisplayName(), decrypted);
        }
        return map;
    }

    /**
     * Get count of stored contact mappings for a group.
     */
    public long getContactMapCount(Long groupId) {
        return contactMapRepository.countByGroupId(groupId);
    }

    // =========================================================================
    // VCF Parsing (raw — in memory, never persisted directly)
    // =========================================================================

    /**
     * Parse a VCF file and return a raw displayName -> normalizedPhone map.
     * All 600 contacts will be in this map — caller is responsible for filtering.
     */
    public Map<String, String> parseVcfRaw(InputStream inputStream) throws IOException {
        Map<String, String> nameToPhone = new LinkedHashMap<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String currentName = null;
            String currentPhone = null;

            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();

                if (line.startsWith("FN:")) {
                    currentName = line.substring(3).trim();
                } else if (line.startsWith("N:") && currentName == null) {
                    // Structured name fallback: Last;First;Middle;...
                    String[] parts = line.substring(2).split(";");
                    StringBuilder sb = new StringBuilder();
                    for (String part : parts) {
                        String p = part.trim();
                        if (!p.isEmpty()) {
                            if (sb.length() > 0)
                                sb.append(" ");
                            sb.append(p);
                        }
                    }
                    if (sb.length() > 0)
                        currentName = sb.toString().trim();
                } else if (line.startsWith("TEL") && line.contains(":")) {
                    int colonIdx = line.indexOf(':');
                    if (colonIdx >= 0 && currentPhone == null) {
                        String normalized = normalizePhone(line.substring(colonIdx + 1).trim());
                        if (normalized.length() >= 7) {
                            currentPhone = normalized;
                        }
                    }
                } else if (line.equalsIgnoreCase("END:VCARD")) {
                    if (currentName != null && !currentName.isBlank() && currentPhone != null) {
                        nameToPhone.put(currentName.trim(), currentPhone);
                    }
                    currentName = null;
                    currentPhone = null;
                }
            }
        }

        logger.debug("VCF raw parse: {} contacts found.", nameToPhone.size());
        return nameToPhone;
    }

    /**
     * Normalize phone to 10-digit local number (strips +91, 0 prefix, spaces,
     * dashes).
     */
    public String normalizePhone(String raw) {
        if (raw == null)
            return "";
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.length() > 10 && digits.startsWith("91"))
            return digits.substring(2);
        if (digits.length() == 11 && digits.startsWith("0"))
            return digits.substring(1);
        return digits;
    }

    // =========================================================================
    // Result DTO
    // =========================================================================

    public record VcfUploadResult(int totalParsed, int matched, int discarded) {
        public String toMessage() {
            return matched + " employee contacts matched and stored. " +
                    discarded + " personal contacts discarded (never saved). " +
                    "Total in VCF: " + totalParsed + ".";
        }
    }
}
