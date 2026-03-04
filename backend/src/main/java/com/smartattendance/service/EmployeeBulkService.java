package com.smartattendance.service;

import com.opencsv.CSVReader;
import com.smartattendance.entity.Employee;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeBulkService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeBulkService.class);

    private final EmployeeRepository employeeRepository;
    private final GroupRepository groupRepository;

    @Transactional
    public String importEmployeesCsv(MultipartFile file) {
        if (file.isEmpty()) {
            return "File is empty";
        }

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            List<String[]> lines = reader.readAll();
            if (lines.isEmpty()) {
                return "CSV has no records";
            }

            // Skip header (Name, Email, Phone, EmployeeCode, GroupId)
            int numImported = 0;
            List<Employee> toSave = new ArrayList<>();

            for (int i = 1; i < lines.size(); i++) {
                String[] columns = lines.get(i);
                if (columns.length < 4)
                    continue;

                String name = columns[0].trim();
                String email = columns[1].trim();
                String phone = columns[2].trim();
                String code = columns[3].trim();

                if (employeeRepository.existsByEmail(email)) {
                    continue; // Skip existing
                }

                Employee emp = Employee.builder()
                        .name(name)
                        .email(email)
                        .phone(phone)
                        .employeeCode(code)
                        .isActive(true)
                        .build();

                // Optional group ID mapping
                if (columns.length > 4 && !columns[4].trim().isEmpty()) {
                    try {
                        Long groupId = Long.parseLong(columns[4].trim());
                        groupRepository.findById(groupId).ifPresent(emp::setGroup);
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid group ID in CSV: {}", columns[4]);
                    }
                }

                toSave.add(emp);
                numImported++;
            }

            employeeRepository.saveAll(toSave);
            return "Successfully imported " + numImported + " employees.";

        } catch (Exception e) {
            logger.error("Error parsing CSV", e);
            return "Failed to parse CSV: " + e.getMessage();
        }
    }
}
