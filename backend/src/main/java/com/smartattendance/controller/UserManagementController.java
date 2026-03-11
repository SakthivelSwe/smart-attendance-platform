package com.smartattendance.controller;

import com.smartattendance.annotation.Audit;
import com.smartattendance.dto.UserDTO;
import com.smartattendance.enums.UserRole;
import com.smartattendance.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UserManagementController {

    private final UserManagementService userManagementService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userManagementService.getAllUsers());
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable("role") UserRole role) {
        return ResponseEntity.ok(userManagementService.getUsersByRole(role));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(userManagementService.getUserById(id));
    }

    /**
     * Update a user's role.
     * Request body: { "role": "MANAGER" }
     */
    @Audit(action = "UPDATE_USER_ROLE")
    @PutMapping("/{id}/role")
    public ResponseEntity<UserDTO> updateUserRole(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> body) {
        UserRole role = UserRole.valueOf(body.get("role").toUpperCase());
        return ResponseEntity.ok(userManagementService.updateUserRole(id, role));
    }

    /**
     * Activate or deactivate a user.
     * Request body: { "isActive": true }
     */
    @Audit(action = "UPDATE_USER_STATUS")
    @PutMapping("/{id}/status")
    public ResponseEntity<UserDTO> updateUserStatus(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(userManagementService.updateUserStatus(id, body.get("isActive")));
    }
}
