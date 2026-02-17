package com.smartattendance.service;

import lombok.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

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
    private static final Pattern MESSAGE_PATTERN = Pattern.compile(
            "\\[?(\\d{1,2}/\\d{1,2}/\\d{2,4}),?\\s+(\\d{1,2}:\\d{2}(?::\\d{2})?(?:\\s*[AaPp][Mm])?)\\]?\\s*-?\\s*([^:]+):\\s*(.*)");

    // Patterns for IN/OUT detection
    private static final Pattern IN_PATTERN = Pattern.compile(
            "(?i)\\b(in|check.?in|arrived|good\\s*morning|gm|login|log.?in|present|punch.?in)\\b");

    private static final Pattern OUT_PATTERN = Pattern.compile(
            "(?i)\\b(out|check.?out|leaving|good\\s*night|gn|logout|log.?out|punch.?out|bye|signing.?off)\\b");

    private static final Pattern WFH_PATTERN = Pattern.compile(
            "(?i)\\b(wfh|work\\s*from\\s*home|remote|working\\s*from\\s*home)\\b");

    private static final List<DateTimeFormatter> TIME_FORMATTERS = Arrays.asList(
            DateTimeFormatter.ofPattern("h:mm:ss a"),
            DateTimeFormatter.ofPattern("h:mm a"),
            DateTimeFormatter.ofPattern("HH:mm:ss"),
            DateTimeFormatter.ofPattern("HH:mm"),
            DateTimeFormatter.ofPattern("h:mm:ssa"),
            DateTimeFormatter.ofPattern("h:mma"));

    /**
     * Parse WhatsApp chat text and return attendance entries per employee.
     */
    public Map<String, AttendanceEntry> parseChat(String chatText) {
        Map<String, AttendanceEntry> attendanceMap = new LinkedHashMap<>();

        if (chatText == null || chatText.isBlank()) {
            return attendanceMap;
        }

        String[] lines = chatText.split("\\n");

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty())
                continue;

            Matcher matcher = MESSAGE_PATTERN.matcher(line);
            if (!matcher.matches())
                continue;

            String timeStr = matcher.group(2).trim();
            String sender = matcher.group(3).trim();
            String message = matcher.group(4).trim();

            // Skip system messages
            if (sender.contains("added") || sender.contains("left") ||
                    sender.contains("changed") || sender.contains("created")) {
                continue;
            }

            LocalTime time = parseTime(timeStr);
            if (time == null)
                continue;

            AttendanceEntry entry = attendanceMap.computeIfAbsent(
                    sender, k -> new AttendanceEntry(sender));

            boolean isWfh = WFH_PATTERN.matcher(message).find();

            if (IN_PATTERN.matcher(message).find()) {
                if (entry.getInTime() == null) {
                    entry.setInTime(time);
                    entry.setWfh(isWfh);
                }
            }

            if (OUT_PATTERN.matcher(message).find()) {
                entry.setOutTime(time); // Always update to get the latest OUT
            }

            // If message contains WFH but no IN/OUT keywords, mark as WFH IN
            if (isWfh && !IN_PATTERN.matcher(message).find() && !OUT_PATTERN.matcher(message).find()) {
                if (entry.getInTime() == null) {
                    entry.setInTime(time);
                    entry.setWfh(true);
                }
            }
        }

        logger.info("Parsed {} employee entries from WhatsApp chat", attendanceMap.size());
        return attendanceMap;
    }

    private LocalTime parseTime(String timeStr) {
        timeStr = timeStr.trim().toUpperCase().replaceAll("\\s+", " ");
        for (DateTimeFormatter formatter : TIME_FORMATTERS) {
            try {
                return LocalTime.parse(timeStr, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        logger.warn("Could not parse time: {}", timeStr);
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
