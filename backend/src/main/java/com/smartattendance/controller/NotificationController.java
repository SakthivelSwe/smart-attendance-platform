package com.smartattendance.controller;

import com.smartattendance.dto.NotificationDTO;
import com.smartattendance.entity.AttendanceGroup;
import com.smartattendance.enums.LeaveStatus;
import com.smartattendance.repository.AttendanceRepository;
import com.smartattendance.repository.GroupRepository;
import com.smartattendance.repository.LeaveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Returns real-time notifications for the header bell:
 * - Pending leave requests (PENDING + MGR_REVIEW)
 * - Active groups with zero attendance records today
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final LeaveRepository leaveRepository;
    private final AttendanceRepository attendanceRepository;
    private final GroupRepository groupRepository;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications() {
        List<NotificationDTO> items = new ArrayList<>();
        LocalDate today = LocalDate.now();

        // --- 1. Pending leave requests (PENDING) ---
        long pendingCount = leaveRepository.findByStatus(LeaveStatus.PENDING).size();
        if (pendingCount > 0) {
            items.add(new NotificationDTO(
                    "LEAVE",
                    "Leaves Waiting Approval",
                    pendingCount + " pending leave request" + (pendingCount > 1 ? "s" : "")
                            + " require your attention.",
                    "Just now",
                    "pending_actions",
                    "amber",
                    (int) pendingCount));
        }

        // --- 2. Leave requests at Manager review stage (TL approved, awaiting manager)
        // ---
        long mgrReviewCount = leaveRepository.findByStatus(LeaveStatus.MGR_REVIEW).size();
        if (mgrReviewCount > 0) {
            items.add(new NotificationDTO(
                    "LEAVE",
                    "Leaves Awaiting Manager Review",
                    mgrReviewCount + " leave request" + (mgrReviewCount > 1 ? "s" : "")
                            + " approved by Team Lead, awaiting manager decision.",
                    "Today",
                    "rate_review",
                    "indigo",
                    (int) mgrReviewCount));
        }

        // --- 3. Active groups with NO attendance records today ---
        List<AttendanceGroup> activeGroups = groupRepository.findByIsActiveTrue();
        List<String> missingGroups = new ArrayList<>();
        for (AttendanceGroup group : activeGroups) {
            long recordCount = attendanceRepository.findByDate(today)
                    .stream()
                    .filter(a -> a.getEmployee() != null
                            && a.getEmployee().getGroup() != null
                            && a.getEmployee().getGroup().getId().equals(group.getId()))
                    .count();
            if (recordCount == 0) {
                missingGroups.add(group.getName());
            }
        }
        if (!missingGroups.isEmpty()) {
            String groupNames = String.join(", ", missingGroups.subList(0, Math.min(2, missingGroups.size())));
            if (missingGroups.size() > 2)
                groupNames += " +" + (missingGroups.size() - 2) + " more";
            items.add(new NotificationDTO(
                    "ATTENDANCE",
                    "Attendance Missing Today",
                    "No attendance data received for: " + groupNames + ".",
                    "Today",
                    "warning",
                    "rose",
                    missingGroups.size()));
        }

        return ResponseEntity.ok(items);
    }
}
