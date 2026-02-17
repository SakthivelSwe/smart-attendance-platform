package com.smartattendance.controller;

import com.smartattendance.dto.AttendanceDTO;
import com.smartattendance.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/date/{date}")
    public ResponseEntity<List<AttendanceDTO>> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getAttendanceByDate(date));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AttendanceDTO>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByEmployee(employeeId));
    }

    @GetMapping("/range")
    public ResponseEntity<List<AttendanceDTO>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(attendanceService.getAttendanceByDateRange(start, end));
    }

    @GetMapping("/employee/{employeeId}/range")
    public ResponseEntity<List<AttendanceDTO>> getByEmployeeAndRange(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(attendanceService.getAttendanceByEmployeeAndDateRange(employeeId, start, end));
    }

    /**
     * Manually trigger attendance processing from WhatsApp chat text.
     */
    @PostMapping("/process")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AttendanceDTO>> processAttendance(@RequestBody Map<String, String> request) {
        String chatText = request.get("chatText");
        String dateStr = request.get("date");
        LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();

        List<AttendanceDTO> result = attendanceService.processWhatsAppAttendance(chatText, date);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AttendanceDTO> updateAttendance(
            @PathVariable Long id,
            @RequestBody AttendanceDTO dto) {
        return ResponseEntity.ok(attendanceService.updateAttendance(id, dto));
    }
}
