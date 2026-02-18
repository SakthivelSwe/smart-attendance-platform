package com.smartattendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "whatsapp_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhatsAppLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sender;
    private LocalDate date;
    private LocalTime inTime;
    private LocalTime outTime;
    private boolean wfh;

    @Builder.Default
    private boolean mapped = false;
}
