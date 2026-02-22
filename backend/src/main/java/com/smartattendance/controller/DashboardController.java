package com.smartattendance.controller;

import com.smartattendance.dto.DashboardStatsDTO;
import com.smartattendance.service.DashboardService;
import com.smartattendance.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final GeminiService geminiService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
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
}
