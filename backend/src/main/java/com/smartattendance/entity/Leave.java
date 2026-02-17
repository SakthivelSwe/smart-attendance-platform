package com.smartattendance.entity;

import com.smartattendance.enums.LeaveStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leaves")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Leave {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private String reason;

    @Column(name = "leave_type")
    private String leaveType; // CASUAL, SICK, EARNED, etc.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private LeaveStatus status = LeaveStatus.PENDING;

    @Column(name = "approved_by")
    private Long approvedBy; // Admin user ID

    @Column(name = "admin_remarks")
    private String adminRemarks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
