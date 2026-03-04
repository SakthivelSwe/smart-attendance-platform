package com.smartattendance.controller;

import com.smartattendance.dto.ProfileDTO;
import com.smartattendance.entity.Employee;
import com.smartattendance.entity.User;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Get the current user's profile (user + employee + team details).
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ProfileDTO> getProfile(@PathVariable("userId") Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        ProfileDTO.ProfileDTOBuilder builder = ProfileDTO.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole());

        // Enrich with employee details
        Optional<Employee> empOpt = employeeRepository.findByEmail(user.getEmail());
        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();
            builder.employeeId(emp.getId())
                    .employeeCode(emp.getEmployeeCode())
                    .phone(emp.getPhone())
                    .designation(emp.getDesignation());

            if (emp.getTeam() != null) {
                builder.teamId(emp.getTeam().getId())
                        .teamName(emp.getTeam().getName());
                if (emp.getTeam().getTeamLead() != null) {
                    builder.teamLeadName(emp.getTeam().getTeamLead().getName());
                }
                if (emp.getTeam().getManager() != null) {
                    builder.managerName(emp.getTeam().getManager().getName());
                }
            }

            if (emp.getGroup() != null) {
                builder.groupId(emp.getGroup().getId())
                        .groupName(emp.getGroup().getName());
            }
        }

        return ResponseEntity.ok(builder.build());
    }

    /**
     * Update basic profile fields (phone, name).
     */
    @PutMapping("/{userId}")
    public ResponseEntity<ProfileDTO> updateProfile(
            @PathVariable("userId") Long userId,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (body.containsKey("name") && body.get("name") != null) {
            user.setName(body.get("name"));
            userRepository.save(user);
        }

        // Update employee phone if provided
        Optional<Employee> empOpt = employeeRepository.findByEmail(user.getEmail());
        if (empOpt.isPresent() && body.containsKey("phone")) {
            Employee emp = empOpt.get();
            emp.setPhone(body.get("phone"));
            employeeRepository.save(emp);
        }

        return getProfile(userId);
    }
}
