package com.smartattendance.controller;

import com.smartattendance.dto.TeamDTO;
import com.smartattendance.entity.User;
import com.smartattendance.enums.UserRole;
import com.smartattendance.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    /**
     * Get all teams. Admin/Manager sees all, Team Lead sees own teams.
     */
    @GetMapping
    public ResponseEntity<List<TeamDTO>> getTeams(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (user.getRole() == UserRole.ADMIN) {
            return ResponseEntity.ok(teamService.getAllTeams());
        } else if (user.getRole() == UserRole.MANAGER) {
            return ResponseEntity.ok(teamService.getTeamsByManager(user.getId()));
        } else if (user.getRole() == UserRole.TEAM_LEAD) {
            return ResponseEntity.ok(teamService.getTeamsByTeamLead(user.getId()));
        }

        return ResponseEntity.ok(List.of());
    }

    /**
     * Get all active teams (for dropdowns/selectors).
     */
    @GetMapping("/active")
    public ResponseEntity<List<TeamDTO>> getActiveTeams() {
        return ResponseEntity.ok(teamService.getActiveTeams());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamDTO> getTeamById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')") // BUG-003 fix
    public ResponseEntity<TeamDTO> createTeam(@Valid @RequestBody TeamDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.createTeam(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')") // BUG-003 fix
    public ResponseEntity<TeamDTO> updateTeam(
            @PathVariable("id") Long id,
            @Valid @RequestBody TeamDTO dto) {
        return ResponseEntity.ok(teamService.updateTeam(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')") // BUG-003 fix
    public ResponseEntity<Void> deleteTeam(@PathVariable("id") Long id) {
        teamService.deleteTeam(id);
        return ResponseEntity.noContent().build();
    }
}
