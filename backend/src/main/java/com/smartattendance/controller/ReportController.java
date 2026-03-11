package com.smartattendance.controller;

import com.smartattendance.dto.EmployeeReportCardDTO;
import com.smartattendance.dto.TeamComparisonDTO;
import com.smartattendance.dto.WorkTrendDTO;
import com.smartattendance.service.ExportService;
import com.smartattendance.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ExportService exportService;

    @GetMapping("/team-comparison")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')") // BUG-005 fix
    public ResponseEntity<List<TeamComparisonDTO>> getTeamComparison(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return ResponseEntity.ok(reportService.getTeamComparison(startDate, endDate));
    }

    @GetMapping("/employee-cards")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')") // BUG-005 fix
    public ResponseEntity<List<EmployeeReportCardDTO>> getEmployeeReportCards(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return ResponseEntity.ok(reportService.getEmployeeReportCards(startDate, endDate));
    }

    @GetMapping("/work-trends")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')") // BUG-005 fix
    public ResponseEntity<List<WorkTrendDTO>> getWorkTrends(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return ResponseEntity.ok(reportService.getWorkTrends(startDate, endDate));
    }

    // --- Exports ---
    @GetMapping("/export/employee-cards")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')") // BUG-005 fix
    public ResponseEntity<byte[]> exportEmployeeCards(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "format", defaultValue = "excel") String format) {

        List<EmployeeReportCardDTO> data = reportService.getEmployeeReportCards(startDate, endDate);

        if ("csv".equalsIgnoreCase(format)) {
            byte[] bytes = exportService.exportEmployeeReportToCsv(data);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"employee_reports.csv\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(bytes);
        } else {
            byte[] bytes = exportService.exportEmployeeReportToExcel(data);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"employee_reports.xlsx\"")
                    .contentType(MediaType
                            .parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(bytes);
        }
    }

    @GetMapping("/export/team-comparison")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')") // BUG-005 fix
    public ResponseEntity<byte[]> exportTeamComparison(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<TeamComparisonDTO> data = reportService.getTeamComparison(startDate, endDate);
        byte[] bytes = exportService.exportTeamComparisonToPdf(data);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"team_comparison.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }
}
