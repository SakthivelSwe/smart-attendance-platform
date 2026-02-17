package com.smartattendance.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "monthly_summary", uniqueConstraints = @UniqueConstraint(columnNames = { "employee_id", "month",
        "year" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlySummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "wfo_count")
    @Builder.Default
    private Integer wfoCount = 0;

    @Column(name = "wfh_count")
    @Builder.Default
    private Integer wfhCount = 0;

    @Column(name = "leave_count")
    @Builder.Default
    private Integer leaveCount = 0;

    @Column(name = "holiday_count")
    @Builder.Default
    private Integer holidayCount = 0;

    @Column(name = "absent_count")
    @Builder.Default
    private Integer absentCount = 0;

    @Column(name = "total_working_days")
    @Builder.Default
    private Integer totalWorkingDays = 0;
}
