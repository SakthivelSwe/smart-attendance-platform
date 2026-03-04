package com.smartattendance.entity;

import com.smartattendance.enums.LeaveStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "leave_approval_chain")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveApprovalChain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_id", nullable = false)
    private Leave leave;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id", nullable = false)
    private User approver;

    // e.g. "TEAM_LEAD", "MANAGER", "ADMIN"
    @Column(name = "approver_role", nullable = false)
    private String approverRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveStatus action; // TL_APPROVED, APPROVED, REJECTED, etc.

    @Column(length = 500)
    private String remarks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
