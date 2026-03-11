package com.smartattendance.controller;

import com.smartattendance.dto.DashboardStatsDTO;
import com.smartattendance.service.DashboardService;
import com.smartattendance.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final GeminiService geminiService;

    /**
     * Organization-wide stats (all roles can call; they see the same global stats).
     */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    /**
     * Team-specific stats — only ADMIN, MANAGER, TEAM_LEAD can access.
     */
    @GetMapping("/team/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<DashboardStatsDTO> getTeamDashboardStats(@PathVariable("teamId") Long teamId) {
        return ResponseEntity.ok(dashboardService.getTeamDashboardStats(teamId));
    }

    /**
     * Personal dashboard — any authenticated user can see their own stats.
     */
    @GetMapping("/me")
    public ResponseEntity<DashboardStatsDTO> getMyDashboardStats(Authentication auth) {
        Long userId = extractUserId(auth);
        return ResponseEntity.ok(dashboardService.getMyDashboardStats(userId));
    }

    @GetMapping("/insights")
    public ResponseEntity<java.util.Map<String, String>> getInsights() {
        DashboardStatsDTO stats = dashboardService.getDashboardStats();
        String summary = String.format(
                "Total Employees: %d. Present Today: %d. Working from Office: %d. Working from Home: %d. On Leave: %d. Absent: %d.",
                stats.getTotalEmployees(), stats.getPresentToday(), stats.getWfoToday(), stats.getWfhToday(),
                stats.getOnLeaveToday(), stats.getAbsentToday());

        String insight = geminiService.generateAttendanceInsights(summary);
        return ResponseEntity.ok(java.util.Map.of("insight", insight));
    }

    private Long extractUserId(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof Long) {
            return (Long) auth.getPrincipal();
        }
        // Fallback: parse from authentication name
        if (auth != null) {
            try {
                return Long.parseLong(auth.getName());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Unable to extract user ID from authentication");
            }
        }
        throw new RuntimeException("Authentication required");
    }
}
