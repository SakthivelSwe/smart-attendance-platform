package com.smartattendance.service;

import com.opencsv.CSVReader;
import com.opencsv.CSVWriter;
import com.smartattendance.entity.Employee;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.GroupRepository;
import com.smartattendance.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.StringWriter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class EmployeeBulkService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeBulkService.class);

    private static final String[] CSV_HEADERS = {
            "Name", "Email", "Phone", "EmployeeCode", "GroupId", "WhatsappName", "Designation", "TeamId"
    };

    private final EmployeeRepository employeeRepository;
    private final GroupRepository groupRepository;
    private final TeamRepository teamRepository;

    @Transactional
    public String importEmployeesCsv(MultipartFile file) {
        if (file.isEmpty()) {
            return "File is empty";
        }

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            List<String[]> lines = reader.readAll();
            if (lines.size() < 2) {
                return "CSV has no data rows";
            }

            // Build header-to-index map for flexible column ordering
            String[] headerRow = lines.get(0);
            Map<String, Integer> headerMap = new HashMap<>();
            for (int i = 0; i < headerRow.length; i++) {
                headerMap.put(headerRow[i].trim().toLowerCase(), i);
            }

            // Validate required columns
            if (!headerMap.containsKey("name") || !headerMap.containsKey("email")) {
                return "CSV must contain at least 'Name' and 'Email' columns. " +
                        "Expected headers: " + String.join(", ", CSV_HEADERS);
            }

            int numImported = 0;
            int numSkipped = 0;
            List<Employee> toSave = new ArrayList<>();

            for (int i = 1; i < lines.size(); i++) {
                String[] columns = lines.get(i);

                String name = getColumn(columns, headerMap, "name");
                String email = getColumn(columns, headerMap, "email");

                if (name.isEmpty() || email.isEmpty()) {
                    numSkipped++;
                    continue;
                }

                if (employeeRepository.existsByEmail(email)) {
                    numSkipped++;
                    continue;
                }

                String phone = getColumn(columns, headerMap, "phone");
                String code = getColumn(columns, headerMap, "employeecode");
                String whatsappName = getColumn(columns, headerMap, "whatsappname");
                String designation = getColumn(columns, headerMap, "designation");

                Employee emp = Employee.builder()
                        .name(name)
                        .email(email)
                        .phone(phone.isEmpty() ? null : phone)
                        .employeeCode(code.isEmpty() ? null : code)
                        .whatsappName(whatsappName.isEmpty() ? null : whatsappName)
                        .designation(designation.isEmpty() ? null : designation)
                        .isActive(true)
                        .build();

                // Optional group ID
                String groupIdStr = getColumn(columns, headerMap, "groupid");
                if (!groupIdStr.isEmpty()) {
                    try {
                        Long groupId = Long.parseLong(groupIdStr);
                        groupRepository.findById(groupId).ifPresent(emp::setGroup);
                    } catch (NumberFormatException e) {
                        logger.warn("Row {}: Invalid group ID '{}'", i + 1, groupIdStr);
                    }
                }

                // Optional team ID
                String teamIdStr = getColumn(columns, headerMap, "teamid");
                if (!teamIdStr.isEmpty()) {
                    try {
                        Long teamId = Long.parseLong(teamIdStr);
                        teamRepository.findById(teamId).ifPresent(emp::setTeam);
                    } catch (NumberFormatException e) {
                        logger.warn("Row {}: Invalid team ID '{}'", i + 1, teamIdStr);
                    }
                }

                toSave.add(emp);
                numImported++;
            }

            employeeRepository.saveAll(toSave);
            String result = "Successfully imported " + numImported + " employees.";
            if (numSkipped > 0) {
                result += " Skipped " + numSkipped + " rows (empty or duplicate).";
            }
            return result;

        } catch (Exception e) {
            logger.error("Error parsing CSV", e);
            return "Failed to parse CSV: " + e.getMessage();
        }
    }

    /**
     * Export all employees as CSV bytes.
     */
    public byte[] exportEmployeesCsv() {
        List<Employee> employees = employeeRepository.findAll();

        try (StringWriter sw = new StringWriter();
             CSVWriter writer = new CSVWriter(sw)) {

            writer.writeNext(CSV_HEADERS);

            for (Employee emp : employees) {
                writer.writeNext(new String[]{
                        emp.getName() != null ? emp.getName() : "",
                        emp.getEmail() != null ? emp.getEmail() : "",
                        emp.getPhone() != null ? emp.getPhone() : "",
                        emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "",
                        emp.getGroup() != null ? String.valueOf(emp.getGroup().getId()) : "",
                        emp.getWhatsappName() != null ? emp.getWhatsappName() : "",
                        emp.getDesignation() != null ? emp.getDesignation() : "",
                        emp.getTeam() != null ? String.valueOf(emp.getTeam().getId()) : ""
                });
            }

            writer.flush();
            return sw.toString().getBytes();

        } catch (Exception e) {
            logger.error("Failed to export employees CSV", e);
            throw new RuntimeException("Failed to generate CSV file");
        }
    }

    /**
     * Generate a blank CSV template with just the headers.
     */
    public byte[] generateCsvTemplate() {
        try (StringWriter sw = new StringWriter();
             CSVWriter writer = new CSVWriter(sw)) {

            writer.writeNext(CSV_HEADERS);
            // Add a sample row as guidance
            writer.writeNext(new String[]{
                    "John Doe", "john@example.com", "9876543210", "EMP001", "5", "John - Team1", "Software Engineer", "1"
            });

            writer.flush();
            return sw.toString().getBytes();

        } catch (Exception e) {
            logger.error("Failed to generate CSV template", e);
            throw new RuntimeException("Failed to generate CSV template");
        }
    }

    private String getColumn(String[] columns, Map<String, Integer> headerMap, String key) {
        Integer idx = headerMap.get(key);
        if (idx == null || idx >= columns.length) {
            return "";
        }
        return columns[idx].trim();
    }
}
