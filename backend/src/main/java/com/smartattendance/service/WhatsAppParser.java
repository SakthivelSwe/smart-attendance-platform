package com.smartattendance.service;

import lombok.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses WhatsApp chat export text to extract attendance data.
 * Expected format from WhatsApp export:
 * [DD/MM/YYYY, HH:MM:SS AM/PM] EmployeeName: IN message
 * [DD/MM/YYYY, HH:MM:SS AM/PM] EmployeeName: OUT message
 */
@Component
public class WhatsAppParser {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppParser.class);

    // Matches WhatsApp message format: [date, time] sender: message
    // Updated to handle Unicode spaces (e.g. NNBSP before AM/PM) and flexible
    // separators
    private static final Pattern MESSAGE_PATTERN = Pattern.compile(
            "^\\[?(\\d{1,2}/\\d{1,2}/\\d{2,4}),?\\s+(\\d{1,2}:\\d{2}(?::\\d{2})?(?:[\\s\\p{Zs}]*[AaPp][Mm])?)\\]?\\s*-?\\s*([^:]+):\\s*(.*)$",
            Pattern.UNICODE_CHARACTER_CLASS);

    // Patterns for IN/OUT detection
    private static final Pattern IN_PATTERN = Pattern.compile(
            "(?i)\\b(in|check.?in|arrived|good\\s*morning|gm|login|log.?in|logg.?in|present|punch.?in)\\b");

    private static final Pattern OUT_PATTERN = Pattern.compile(
            "(?i)\\b(out|check.?out|leaving|good\\s*night|gn|logout|log.?out|logg.?out|punch.?out|bye|signing.?off|log.?off|logg.?off)\\b");

    private static final Pattern WFH_PATTERN = Pattern.compile(
            "(?i)\\b(wfh|work\\s*from\\s*home|remote|working\\s*from\\s*home)\\b");

    private static final List<DateTimeFormatter> TIME_FORMATTERS = Arrays.asList(
            DateTimeFormatter.ofPattern("h:mm:ss a", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("HH:mm:ss", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("HH:mm", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("H:mm:ss", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("H:mm", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("h:mm:ssa", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("h:mma", Locale.ENGLISH));

    private static final List<DateTimeFormatter> DATE_FORMATTERS = Arrays.asList(
            DateTimeFormatter.ofPattern("d/M/yy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("d/M/yyyy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("dd/MM/yy", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.ENGLISH));

    /**
     * Parse WhatsApp chat text and return attendance entries grouped by DATE and
     * then EMPLOYEE.
     * Returns: Map<LocalDate, Map<String, AttendanceEntry>>
     */
    public Map<LocalDate, Map<String, AttendanceEntry>> parseChat(String chatText) {
        Map<LocalDate, Map<String, AttendanceEntry>> fullAttendanceMap = new LinkedHashMap<>();

        if (chatText == null || chatText.isBlank()) {
            return fullAttendanceMap;
        }

        String[] lines = chatText.split("\\n");

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty())
                continue;

            Matcher matcher = MESSAGE_PATTERN.matcher(line);
            if (!matcher.matches())
                continue;

            String dateStr = matcher.group(1).trim();
            String timeStr = matcher.group(2).trim();
            String sender = matcher.group(3).trim();
            String message = matcher.group(4).trim();

            logger.debug("Found Message - Date: {}, Time: {}, Sender: {}", dateStr, timeStr, sender);

            // Skip system messages
            if (sender.contains("added") || sender.contains("left") ||
                    sender.contains("changed") || sender.contains("created") || sender.contains("security code")) {
                continue;
            }

            LocalDate date = parseDate(dateStr);
            LocalTime time = parseTime(timeStr);

            if (date == null || time == null)
                continue;

            // Get or create the map for this specific date
            Map<String, AttendanceEntry> dailyMap = fullAttendanceMap.computeIfAbsent(date, k -> new LinkedHashMap<>());

            AttendanceEntry entry = dailyMap.computeIfAbsent(sender, k -> new AttendanceEntry(sender));

            boolean isWfh = WFH_PATTERN.matcher(message).find();

            // Try to extract manual time from message
            LocalTime manualTime = extractManualTime(message);

            if (IN_PATTERN.matcher(message).find()) {
                if (entry.getInTime() == null) {
                    entry.setInTime(manualTime != null ? manualTime : time);
                    entry.setWfh(isWfh);
                }
            }

            if (OUT_PATTERN.matcher(message).find()) {
                // Always update to get the latest OUT for that day
                entry.setOutTime(manualTime != null ? manualTime : time);
            }

            // If message contains WFH but no IN/OUT keywords, mark as WFH IN
            if (isWfh && !IN_PATTERN.matcher(message).find() && !OUT_PATTERN.matcher(message).find()) {
                if (entry.getInTime() == null) {
                    entry.setInTime(time);
                    entry.setWfh(true);
                }
            }
        }

        logger.info("Parsed attendance for {} days from WhatsApp chat", fullAttendanceMap.size());
        return fullAttendanceMap;
    }

    private LocalDate parseDate(String dateStr) {
        String[] parts = dateStr.split("/");
        if (parts.length >= 3) {
            try {
                int d = Integer.parseInt(parts[0].trim());
                int m = Integer.parseInt(parts[1].trim());
                int y = Integer.parseInt(parts[2].trim());
                if (y < 100)
                    y += 2000;
                return LocalDate.of(y, m, d);
            } catch (Exception e) {
                // Ignore and fall through to formatter fallback
            }
        }

        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        logger.debug("Could not parse date: {}", dateStr);
        return null;
    }

    private LocalTime parseTime(String timeStr) {
        if (timeStr == null)
            return null;

        String cleaned = timeStr.toUpperCase()
                .replaceAll("[^0-9A-Z:.]", " ")
                .replaceAll("\\s+", " ")
                .trim();

        String colonTime = cleaned.replace(".", ":");

        try {
            boolean isPM = colonTime.contains("PM");
            boolean isAM = colonTime.contains("AM");
            String timeOnly = colonTime.replace("AM", "").replace("PM", "").trim();
            String[] parts = timeOnly.split(":");

            if (parts.length >= 2) {
                int h = Integer.parseInt(parts[0].trim());
                int m = Integer.parseInt(parts[1].trim());
                int s = parts.length > 2 ? Integer.parseInt(parts[2].trim()) : 0;

                if (h <= 23 && m <= 59 && s <= 59) {
                    if (isPM && h < 12)
                        h += 12;
                    if (isAM && h == 12)
                        h = 0;
                    return LocalTime.of(h, m, s);
                }
            }
        } catch (Exception e) {
            // Ignore and fall through to formatter fallback
        }

        logger.debug("Attempting to parse cleaned time: '{}' from original: '{}'", cleaned, timeStr);

        for (DateTimeFormatter formatter : TIME_FORMATTERS) {
            try {
                return LocalTime.parse(cleaned, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }

        if (!colonTime.equals(cleaned)) {
            for (DateTimeFormatter formatter : TIME_FORMATTERS) {
                try {
                    return LocalTime.parse(colonTime, formatter);
                } catch (DateTimeParseException ignored) {
                }
            }
        }

        logger.debug("Could not parse time: '{}' (original: '{}')", cleaned, timeStr);
        return null;
    }

    // Regex for time extraction (flexible separators, optional seconds, optional
    // AM/PM with unicode support)
    private static final Pattern MANUAL_TIME_PATTERN = Pattern.compile(
            "(\\d{1,2}[:.]\\d{2}(?::\\d{2})?(?:[\\s\\p{Zs}]*[AaPp][Mm])?)",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CHARACTER_CLASS);

    private LocalTime extractManualTime(String message) {
        // Simple heuristic: Extract the first valid time-like string found in the
        // message
        Matcher m = MANUAL_TIME_PATTERN.matcher(message);
        while (m.find()) {
            LocalTime extracted = parseTime(m.group(1));
            // Basic sanity check?
            if (extracted != null) {
                return extracted;
            }
        }
        return null;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceEntry {
        private String employeeName;
        private LocalTime inTime;
        private LocalTime outTime;
        private boolean wfh;

        public AttendanceEntry(String employeeName) {
            this.employeeName = employeeName;
        }
    }
}
