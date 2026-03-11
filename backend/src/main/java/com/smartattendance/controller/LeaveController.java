package com.smartattendance.controller;

import com.smartattendance.dto.LeaveDTO;

import com.smartattendance.service.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<List<LeaveDTO>> getAllLeaves() {
        return ResponseEntity.ok(leaveService.getAllLeaves());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<List<LeaveDTO>> getPendingLeaves() {
        return ResponseEntity.ok(leaveService.getPendingLeaves());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveDTO>> getLeavesByEmployee(@PathVariable("employeeId") Long employeeId) {
        return ResponseEntity.ok(leaveService.getLeavesByEmployee(employeeId));
    }

    @PostMapping
    public ResponseEntity<LeaveDTO> applyLeave(@Valid @RequestBody LeaveDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(leaveService.applyLeave(dto));
    }

    @PutMapping("/{id}/tl-approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')") // BUG-008 fix: ADMIN was missing
    public ResponseEntity<LeaveDTO> approveByTeamLead(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(leaveService.approveByTeamLead(id, authentication.getName(), remarks));
    }

    @PutMapping("/{id}/manager-approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')") // BUG-008 fix: ADMIN was missing
    public ResponseEntity<LeaveDTO> approveByManager(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(leaveService.approveByManager(id, authentication.getName(), remarks));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LeaveDTO> approveByAdmin(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(leaveService.approveByManager(id, authentication.getName(), remarks));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEAD')")
    public ResponseEntity<LeaveDTO> rejectLeave(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(leaveService.rejectLeave(id, authentication.getName(), remarks));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<LeaveDTO> cancelLeave(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(leaveService.cancelLeave(id, authentication.getName(), remarks));
    }
}
