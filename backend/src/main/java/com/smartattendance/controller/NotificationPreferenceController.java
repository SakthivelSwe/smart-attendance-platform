package com.smartattendance.controller;

import com.smartattendance.entity.NotificationPreference;
import com.smartattendance.entity.User;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.NotificationPreferenceRepository;
import com.smartattendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    /**
     * Get notification preferences for a user. Creates defaults if none exist.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<NotificationPreference> getPreferences(@PathVariable("userId") Long userId) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));
        return ResponseEntity.ok(pref);
    }

    /**
     * Update notification preferences.
     */
    @PutMapping("/{userId}")
    public ResponseEntity<NotificationPreference> updatePreferences(
            @PathVariable("userId") Long userId,
            @RequestBody Map<String, Object> body) {

        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));

        if (body.containsKey("teamDailySummary"))
            pref.setTeamDailySummary((Boolean) body.get("teamDailySummary"));
        if (body.containsKey("absenceAlert"))
            pref.setAbsenceAlert((Boolean) body.get("absenceAlert"));
        if (body.containsKey("managerDailySummary"))
            pref.setManagerDailySummary((Boolean) body.get("managerDailySummary"));
        if (body.containsKey("lowAttendanceAlert"))
            pref.setLowAttendanceAlert((Boolean) body.get("lowAttendanceAlert"));
        if (body.containsKey("lowAttendanceThreshold"))
            pref.setLowAttendanceThreshold((Integer) body.get("lowAttendanceThreshold"));
        if (body.containsKey("leaveRequestAlert"))
            pref.setLeaveRequestAlert((Boolean) body.get("leaveRequestAlert"));
        if (body.containsKey("leaveStatusAlert"))
            pref.setLeaveStatusAlert((Boolean) body.get("leaveStatusAlert"));
        if (body.containsKey("emailEnabled"))
            pref.setEmailEnabled((Boolean) body.get("emailEnabled"));
        if (body.containsKey("whatsappEnabled"))
            pref.setWhatsappEnabled((Boolean) body.get("whatsappEnabled"));

        return ResponseEntity.ok(preferenceRepository.save(pref));
    }

    private NotificationPreference createDefaultPreferences(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        NotificationPreference pref = NotificationPreference.builder()
                .user(user)
                .build();
        return preferenceRepository.save(pref);
    }
}
