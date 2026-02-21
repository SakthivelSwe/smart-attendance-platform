package com.smartattendance.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.ValueRange;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.smartattendance.entity.Attendance;
import com.smartattendance.entity.Employee;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

@Service
public class GoogleSheetsService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleSheetsService.class);
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    @Value("${app.google.sheets.credentials-path}")
    private Resource credentialsResource;

    @Value("${app.gmail.application-name:Smart Attendance}")
    private String applicationName;

    private Sheets sheetsService;

    @PostConstruct
    public void init() {
        try {
            logger.info("Initializing Google Sheets Service...");
            NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();

            InputStream credentialsStream = credentialsResource.getInputStream();
            GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream)
                    .createScoped(Collections.singletonList(SheetsScopes.SPREADSHEETS));

            this.sheetsService = new Sheets.Builder(httpTransport, JSON_FACTORY,
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName(applicationName)
                    .build();

            logger.info("Google Sheets Service initialized successfully.");
        } catch (IOException | GeneralSecurityException e) {
            logger.error("Failed to initialize Google Sheets Service: {}", e.getMessage());
        }
    }

    /**
     * Updates the attendance sheet with the status.
     */
    public String updateAttendanceSync(String spreadsheetId, String expectedMonth, Attendance record) {
        if (spreadsheetId == null || spreadsheetId.isBlank()) {
            logger.info("No Spreadsheet ID configured for this group, skipping sync.");
            return "No Spreadsheet ID"; // Return null as no update was performed
        }

        try {
            Employee employee = record.getEmployee();
            LocalDate date = record.getDate();
            String valueToWrite = formatStatusValue(record);

            // 1. Get sheet tabs
            com.google.api.services.sheets.v4.model.Spreadsheet spreadsheet = sheetsService.spreadsheets()
                    .get(spreadsheetId).execute();
            List<com.google.api.services.sheets.v4.model.Sheet> sheetList = spreadsheet.getSheets();
            if (sheetList == null || sheetList.isEmpty()) {
                logger.warn("No sheets found in spreadsheet ID: {}", spreadsheetId);
                return "No sheets found";
            }

            // 2. Find matching tab (same mapping logic as before)
            String fullMonth = date.getMonth().name().substring(0, 1).toUpperCase()
                    + date.getMonth().name().substring(1).toLowerCase();
            String shortMonth = fullMonth.substring(0, 3);
            String year2Digit = String.valueOf(date.getYear()).substring(2);
            String year4Digit = String.valueOf(date.getYear());

            String sheetName = sheetList.get(0).getProperties().getTitle(); // Default to first sheet
            boolean foundMatch = false;
            for (com.google.api.services.sheets.v4.model.Sheet sheet : sheetList) {
                String title = sheet.getProperties().getTitle().trim();
                // Check if title matches expected patterns like "Feb26", "Feb 26", "February
                // 2026"
                if (title.equalsIgnoreCase(shortMonth + year2Digit) ||
                        title.equalsIgnoreCase(shortMonth + " " + year2Digit) ||
                        title.equalsIgnoreCase(fullMonth + " " + year4Digit) ||
                        (title.toLowerCase().startsWith(shortMonth.toLowerCase()) && title.contains(year2Digit))) {
                    sheetName = title;
                    foundMatch = true;
                    break;
                }
            }

            if (!foundMatch) {
                logger.warn("Could not accurately match sheet for {}{}. Expected: {}, using default: {}",
                        shortMonth + year2Digit, expectedMonth, sheetName);
            }

            String sheetRange = "'" + sheetName.replace("'", "''") + "'";

            // 2. Fetch the entire sheet with UNFORMATTED_VALUE to easily parse dates
            ValueRange response = sheetsService.spreadsheets().values()
                    .get(spreadsheetId, sheetRange)
                    .setValueRenderOption("UNFORMATTED_VALUE")
                    .execute();

            List<List<Object>> values = response.getValues();
            if (values == null || values.isEmpty()) {
                logger.warn("No data found in sheet: {}", sheetName);
                return "No data found";
            }

            // 3. Find the "Employee Name" header cell
            int headerRowIndex = -1;
            int employeeNameColIndex = -1;

            for (int r = 0; r < values.size(); r++) {
                List<Object> row = values.get(r);
                for (int c = 0; c < row.size(); c++) {
                    Object cell = row.get(c);
                    if (cell instanceof String str && str.trim().equalsIgnoreCase("Employee Name")) {
                        headerRowIndex = r;
                        employeeNameColIndex = c;
                        break;
                    }
                }
                if (headerRowIndex != -1)
                    break;
            }

            if (headerRowIndex == -1) {
                logger.warn("Could not find 'Employee Name' header in sheet '{}'", sheetName);
                return "No employee name header";
            }

            // 4. Find the Date column in the header row
            int dateColumnIndex = -1;
            List<Object> headerRow = values.get(headerRowIndex);

            // Format dates we want to check just in case it's a string
            DateTimeFormatter fmt1 = DateTimeFormatter.ofPattern("d-MMM-yy");
            DateTimeFormatter fmt2 = DateTimeFormatter.ofPattern("dd-MMM-yy");
            DateTimeFormatter fmt3 = DateTimeFormatter.ofPattern("d-MMM-yyyy");
            DateTimeFormatter fmt4 = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
            DateTimeFormatter fmt5 = DateTimeFormatter.ofPattern("dd/MM/yyyy");

            Double targetSerialDate = getExcelSerialDate(date);

            for (int c = employeeNameColIndex + 1; c < headerRow.size(); c++) {
                Object cell = headerRow.get(c);
                if (cell == null)
                    continue;

                boolean match = false;
                if (cell instanceof Number num) {
                    // Excel Date is a number (days since Dec 30 1899)
                    if (Math.abs(num.doubleValue() - targetSerialDate) < 1.0) {
                        match = true;
                    }
                } else if (cell instanceof String str) {
                    str = str.trim();
                    if (str.equalsIgnoreCase(date.format(fmt1)) ||
                            str.equalsIgnoreCase(date.format(fmt2)) ||
                            str.equalsIgnoreCase(date.format(fmt3)) ||
                            str.equalsIgnoreCase(date.format(fmt4)) ||
                            str.equalsIgnoreCase(date.format(fmt5)) ||
                            str.equals(String.format("%02d", date.getDayOfMonth())) ||
                            str.equals(String.valueOf(date.getDayOfMonth()))) {
                        match = true;
                    }
                }

                if (match) {
                    dateColumnIndex = c;
                    break;
                }
            }

            if (dateColumnIndex == -1) {
                String dump = headerRow.toString();
                throw new RuntimeException("Could not find column for date '" + date + "' (Serial: " + targetSerialDate
                        + ") in sheet '" + sheetName + "'. Header length: " + headerRow.size() + ". Header Dump: "
                        + (dump.length() > 500 ? dump.substring(0, 500) : dump));
            }

            // 5. Find the Row for the specific employee
            int employeeRowIndex = -1;
            logger.info("DEBUG: Looking for employee '{}' (normalized: '{}') in sheet '{}'",
                    employee.getName(),
                    employee.getName() != null ? employee.getName().replaceAll("[\\s\\u00A0]+", "").trim() : "null",
                    sheetName);
            for (int r = headerRowIndex + 1; r < values.size(); r++) {
                List<Object> row = values.get(r);
                if (row.size() > employeeNameColIndex) {
                    Object cell = row.get(employeeNameColIndex);
                    if (cell instanceof String rowEmpName) {
                        if (employee.getName() != null) {
                            String normalizedSheetName = rowEmpName.replaceAll("[\\s\\u00A0]+", "").trim();
                            String normalizedDbName = employee.getName().replaceAll("[\\s\\u00A0]+", "").trim();
                            boolean match = normalizedSheetName.equalsIgnoreCase(normalizedDbName);

                            if (match) {
                                logger.info("DEBUG: MATCH FOUND at row {} for '{}' == '{}'", r, normalizedSheetName,
                                        normalizedDbName);
                                employeeRowIndex = r;
                                break;
                            }
                        }
                    }
                }
            }

            if (employeeRowIndex == -1) {
                logger.warn("Could not find row for employee '{}' in sheet '{}'", employee.getName(), sheetName);
                return "Employee Row Not Found";
            }

            // Write the value: Convert 0-indexed row/col to A1 notation
            String cellA1 = getCellA1Notation(dateColumnIndex, employeeRowIndex);

            // Note: If sheetName has spaces, it must be surrounded by single quotes
            String targetRange = "'" + sheetName.replace("'", "''") + "'!" + cellA1;

            ValueRange body = new ValueRange()
                    .setValues(Collections.singletonList(Collections.singletonList(valueToWrite)));

            int maxRetries = 3;
            int attempt = 0;
            boolean success = false;

            while (attempt < maxRetries && !success) {
                try {
                    sheetsService.spreadsheets().values()
                            .update(spreadsheetId, targetRange, body)
                            .setValueInputOption("USER_ENTERED")
                            .execute();
                    success = true;
                    logger.info("Successfully synced {} to {} for employee {}", valueToWrite, targetRange,
                            employee.getName());
                    return targetRange;
                } catch (com.google.api.client.googleapis.json.GoogleJsonResponseException e) {
                    if (e.getStatusCode() == 429) {
                        attempt++;
                        logger.warn("Rate limit exceeded for {} (429). Retrying attempt {}/{}", employee.getName(),
                                attempt, maxRetries);
                        try {
                            Thread.sleep((long) Math.pow(2, attempt) * 1000); // Exponential backoff: 2s, 4s, 8s
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                    } else {
                        throw e;
                    }
                }
            }

            if (!success) {
                logger.error("Failed to update Google Sheet after {} attempts for employee {}", maxRetries,
                        employee.getName());
                return "Failed attempts";
            }

        } catch (com.google.api.client.googleapis.json.GoogleJsonResponseException e) {
            String details = "";
            try {
                details = e.getDetails().toPrettyString();
                logger.error("Failed to update Google Sheet, API Error: \n" + details, e);
            } catch (Exception ex) {
                logger.error("Failed to update Google Sheet, API Error: " + e.getMessage(), e);
            }
            throw new RuntimeException("Google Sheets API reported: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Failed to update Google Sheet: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update Google Sheet", e);
        }
        return "Unknown error";
    }

    private double getExcelSerialDate(LocalDate date) {
        // Google Sheets / Excel serial date epoch is Dec 30 1899
        LocalDate epoch = LocalDate.of(1899, 12, 30);
        return (double) java.time.temporal.ChronoUnit.DAYS.between(epoch, date);
    }

    private String formatStatusValue(Attendance record) {
        if (record.getDate() != null && record.getDate().getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            return "H";
        }
        return switch (record.getStatus()) {
            case WFO -> "WFO (8)";
            case WFH -> "WFH (8)";
            case LEAVE -> "0";
            case HOLIDAY -> "H";
            case ABSENT -> "L";
            case BENCH -> "Bench";
            case TRAINING -> "Training";
        };
    }

    private String getCellA1Notation(int colIndex, int rowIndex) {
        String columnLetter = getColumnLetter(colIndex + 1); // 1-indexed
        return columnLetter + (rowIndex + 1); // 1-indexed
    }

    private String getColumnLetter(int columnNumber) {
        StringBuilder columnName = new StringBuilder();
        int dividend = columnNumber;
        int modulo;

        while (dividend > 0) {
            modulo = (dividend - 1) % 26;
            columnName.insert(0, (char) (65 + modulo));
            dividend = (dividend - modulo) / 26;
        }

        return columnName.toString();
    }
}
