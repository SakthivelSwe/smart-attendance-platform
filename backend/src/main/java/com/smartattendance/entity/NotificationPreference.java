package com.smartattendance.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @JsonProperty("userId")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    // Team Lead: receive daily summary for your team
    @Column(name = "team_daily_summary")
    @Builder.Default
    private Boolean teamDailySummary = true;

    // Team Lead: receive absence alerts
    @Column(name = "absence_alert")
    @Builder.Default
    private Boolean absenceAlert = true;

    // Manager: receive daily summary for your teams
    @Column(name = "manager_daily_summary")
    @Builder.Default
    private Boolean managerDailySummary = true;

    // Manager: low attendance alert
    @Column(name = "low_attendance_alert")
    @Builder.Default
    private Boolean lowAttendanceAlert = true;

    // Low attendance threshold percentage
    @Column(name = "low_attendance_threshold")
    @Builder.Default
    private Integer lowAttendanceThreshold = 70;

    // Leave request notification
    @Column(name = "leave_request_alert")
    @Builder.Default
    private Boolean leaveRequestAlert = true;

    // Leave approval/rejection notification
    @Column(name = "leave_status_alert")
    @Builder.Default
    private Boolean leaveStatusAlert = true;

    // Email channel
    @Column(name = "email_enabled")
    @Builder.Default
    private Boolean emailEnabled = true;

    // WhatsApp channel
    @Column(name = "whatsapp_enabled")
    @Builder.Default
    private Boolean whatsappEnabled = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
