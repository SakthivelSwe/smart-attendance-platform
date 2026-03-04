package com.smartattendance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "leave_balances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "leave_year", nullable = false)
    private Integer year;

    // e.g. "CASUAL", "SICK", "EARNED"
    @Column(name = "leave_type", nullable = false)
    private String leaveType;

    @Column(name = "total_days", nullable = false)
    private Double totalDays;

    @Column(name = "used_days", nullable = false)
    @Builder.Default
    private Double usedDays = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Double getRemainingDays() {
        return totalDays - usedDays;
    }
}
