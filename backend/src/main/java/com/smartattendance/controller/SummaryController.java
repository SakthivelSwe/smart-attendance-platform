package com.smartattendance.controller;

import com.smartattendance.dto.MonthlySummaryDTO;
import com.smartattendance.service.MonthlySummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/summary")
@RequiredArgsConstructor
public class SummaryController {

    private final MonthlySummaryService summaryService;

    @GetMapping("/monthly")
    public ResponseEntity<List<MonthlySummaryDTO>> getMonthlySummary(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(summaryService.getSummaryByMonthAndYear(month, year));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<MonthlySummaryDTO>> getEmployeeSummary(@PathVariable Long employeeId) {
        return ResponseEntity.ok(summaryService.getSummaryByEmployee(employeeId));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MonthlySummaryDTO>> generateSummary(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(summaryService.generateMonthlySummary(month, year));
    }
}
