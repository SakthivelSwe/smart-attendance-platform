package com.smartattendance.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO representing a single parsed attendance record from WhatsApp export.
 * Used in the import preview response before the user confirms saving.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhatsAppImportRecordDTO {

    private String senderName;       // The name/number as it appeared in WhatsApp chat
    private String resolvedPhone;    // Phone number resolved from VCF (null if not resolved)
    private Long employeeId;         // Matched employee ID (null if unmatched)
    private String employeeName;     // Matched employee official name (null if unmatched)
    private String employeeCode;     // Matched employee code

    private LocalDate date;
    private LocalTime inTime;
    private LocalTime outTime;
    private boolean wfh;

    private String status;           // WFO / WFH / ABSENT / matched status
    private boolean matched;         // true = employee found, false = unmatched/unknown
    private String matchMethod;      // "VCF_NAME", "PHONE", "WHATSAPP_NAME", "EMPLOYEE_NAME"
}
