package com.smartattendance.controller;

import com.smartattendance.dto.LeaveDTO;
import com.smartattendance.entity.User;
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LeaveDTO>> getAllLeaves() {
        return ResponseEntity.ok(leaveService.getAllLeaves());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LeaveDTO>> getPendingLeaves() {
        return ResponseEntity.ok(leaveService.getPendingLeaves());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveDTO>> getLeavesByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(leaveService.getLeavesByEmployee(employeeId));
    }

    @PostMapping
    public ResponseEntity<LeaveDTO> applyLeave(@Valid @RequestBody LeaveDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(leaveService.applyLeave(dto));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LeaveDTO> approveLeave(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        User admin = (User) authentication.getPrincipal();
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(leaveService.approveLeave(id, admin.getId(), remarks));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LeaveDTO> rejectLeave(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        User admin = (User) authentication.getPrincipal();
        String remarks = body != null ? body.get("remarks") : null;
        return ResponseEntity.ok(leaveService.rejectLeave(id, admin.getId(), remarks));
    }
}
