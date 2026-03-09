package com.smartattendance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Stores the contact name -> phone number mapping uploaded from a VCF file.
 *
 * One ContactMapEntry per saved contact name per attendance group.
 * This is the "bridge" that allows the system to resolve WhatsApp display names
 * (e.g. "Mohana @TVM") to phone numbers (e.g. "8736273920"), which are then
 * matched to employees in the database.
 *
 * Lifecycle:
 *   - Created when a manager uploads a contacts.vcf file (one-time setup).
 *   - Reused automatically every time a WhatsApp chat export is processed.
 *   - Can be updated by re-uploading a newer VCF file.
 */
@Entity
@Table(name = "contact_map_entries",
        uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "display_name"}),
        indexes = {
                @Index(name = "idx_contact_map_group", columnList = "group_id"),
                @Index(name = "idx_contact_map_phone", columnList = "phone_number")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMapEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The attendance group this mapping belongs to.
     * Each Team Lead / Manager manages their own group's contact map.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private AttendanceGroup group;

    /**
     * The name as saved in the phone contacts / shown in WhatsApp export.
     * Example: "Mohana @TVM"
     */
    @Column(name = "display_name", nullable = false)
    private String displayName;

    /**
     * The 10-digit phone number extracted from the VCF file.
     * Example: "8736273920"
     */
    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
