package com.smartattendance.service;

import com.smartattendance.entity.Employee;
import com.smartattendance.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VcfSyncService {

    private static final Logger logger = LoggerFactory.getLogger(VcfSyncService.class);

    private final EmployeeRepository employeeRepository;

    @Transactional
    public void syncEmployeesWithVcf(String vcfText) {
        if (vcfText == null || vcfText.isBlank()) {
            return;
        }

        logger.info("Starting VCF sync. Parsing contacts...");

        List<VCard> vCards = parseVcf(vcfText);
        logger.info("Found {} contacts in the VCF file.", vCards.size());

        if (vCards.isEmpty()) {
            return;
        }

        List<Employee> activeEmployees = employeeRepository.findByIsActiveTrueWithGroup();
        int updateCount = 0;

        for (Employee employee : activeEmployees) {
            String empPhone = employee.getPhone();
            if (empPhone == null || empPhone.isBlank()) {
                continue;
            }

            String normEmpPhone = normalizePhone(empPhone);
            if (normEmpPhone.length() < 5) continue; // safety check

            for (VCard vCard : vCards) {
                if (vCard.name != null && !vCard.name.isBlank() && vCard.phones != null) {
                    boolean matched = false;
                    for (String vcfPhone : vCard.phones) {
                        String normVcfPhone = normalizePhone(vcfPhone);
                        if (normVcfPhone.length() >= 5 && 
                            (normVcfPhone.equals(normEmpPhone) || normVcfPhone.contains(normEmpPhone) || normEmpPhone.contains(normVcfPhone))) {
                            
                            logger.info("Matched Employee: {} with VCF Contact: {} using phone {}", employee.getName(), vCard.name, normVcfPhone);
                            
                            employee.setWhatsappName(vCard.name);
                            matched = true;
                            updateCount++;
                            break;
                        }
                    }
                    if (matched) break;
                }
            }
        }
        
        if (updateCount > 0) {
            employeeRepository.saveAll(activeEmployees);
            logger.info("VCF Sync Complete. Successfully updated {} employees' whatsapp_name.", updateCount);
        } else {
            logger.info("VCF Sync Complete. No new matches found.");
        }
    }

    private List<VCard> parseVcf(String text) {
        List<VCard> contacts = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new StringReader(text))) {
            String line;
            VCard current = null;
            
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.equals("BEGIN:VCARD")) {
                    current = new VCard();
                } else if (line.equals("END:VCARD")) {
                    if (current != null) {
                        contacts.add(current);
                        current = null;
                    }
                } else if (current != null) {
                    if (line.startsWith("FN:")) {
                        current.name = line.substring(3).trim();
                    } else if (line.startsWith("TEL") && line.contains(":")) {
                        // TEL;CELL:+123... or TEL:+123...
                        int colonIdx = line.indexOf(":");
                        if (colonIdx != -1 && colonIdx < line.length() - 1) {
                            String phone = line.substring(colonIdx + 1).trim();
                            current.phones.add(phone);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to parse VCF file: {}", e.getMessage());
        }
        return contacts;
    }

    private String normalizePhone(String info) {
        if (info == null)
            return "";
        // Remove all non-digit characters
        String digits = info.replaceAll("[^0-9]", "");
        // Remove leading 91 (India country code) if present and length > 10
        if (digits.length() > 10 && digits.startsWith("91")) {
            return digits.substring(2);
        }
        return digits;
    }

    private static class VCard {
        String name;
        List<String> phones = new ArrayList<>();
    }
}
