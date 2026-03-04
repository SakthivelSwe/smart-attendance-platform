package com.smartattendance.service;

import com.smartattendance.dto.TeamDTO;
import com.smartattendance.entity.Team;
import com.smartattendance.entity.User;
import com.smartattendance.exception.ResourceNotFoundException;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.repository.TeamRepository;
import com.smartattendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private static final Logger logger = LoggerFactory.getLogger(TeamService.class);

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    public List<TeamDTO> getAllTeams() {
        return teamRepository.findAllWithLeadAndManager().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TeamDTO> getActiveTeams() {
        return teamRepository.findActiveWithLeadAndManager().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TeamDTO getTeamById(Long id) {
        Team team = teamRepository.findByIdWithLeadAndManager(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", id));
        return toDTO(team);
    }

    /**
     * Get teams managed by a specific team lead.
     */
    public List<TeamDTO> getTeamsByTeamLead(Long userId) {
        return teamRepository.findByTeamLeadId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get teams managed by a specific manager.
     */
    public List<TeamDTO> getTeamsByManager(Long userId) {
        return teamRepository.findByManagerId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TeamDTO createTeam(TeamDTO dto) {
        if (teamRepository.existsByName(dto.getName())) {
            throw new IllegalArgumentException("Team with name '" + dto.getName() + "' already exists");
        }
        if (dto.getTeamCode() != null && teamRepository.existsByTeamCode(dto.getTeamCode())) {
            throw new IllegalArgumentException("Team with code '" + dto.getTeamCode() + "' already exists");
        }

        Team team = Team.builder()
                .name(dto.getName())
                .teamCode(dto.getTeamCode())
                .description(dto.getDescription())
                .emailAlias(dto.getEmailAlias())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();

        if (dto.getTeamLeadId() != null) {
            User teamLead = userRepository.findById(dto.getTeamLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("User (Team Lead)", "id", dto.getTeamLeadId()));
            team.setTeamLead(teamLead);
        }

        if (dto.getManagerId() != null) {
            User manager = userRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User (Manager)", "id", dto.getManagerId()));
            team.setManager(manager);
        }

        Team saved = teamRepository.save(team);
        logger.info("Team created: {} ({})", saved.getName(), saved.getTeamCode());
        return toDTO(saved);
    }

    @Transactional
    public TeamDTO updateTeam(Long id, TeamDTO dto) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", id));

        // Check name uniqueness if changed
        if (!team.getName().equalsIgnoreCase(dto.getName()) && teamRepository.existsByName(dto.getName())) {
            throw new IllegalArgumentException("Team with name '" + dto.getName() + "' already exists");
        }

        team.setName(dto.getName());
        team.setTeamCode(dto.getTeamCode());
        team.setDescription(dto.getDescription());
        team.setEmailAlias(dto.getEmailAlias());
        team.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : team.getIsActive());

        if (dto.getTeamLeadId() != null) {
            User teamLead = userRepository.findById(dto.getTeamLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("User (Team Lead)", "id", dto.getTeamLeadId()));
            team.setTeamLead(teamLead);
        } else {
            team.setTeamLead(null);
        }

        if (dto.getManagerId() != null) {
            User manager = userRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User (Manager)", "id", dto.getManagerId()));
            team.setManager(manager);
        } else {
            team.setManager(null);
        }

        Team saved = teamRepository.save(team);
        logger.info("Team updated: {} ({})", saved.getName(), saved.getTeamCode());
        return toDTO(saved);
    }

    @Transactional
    public void deleteTeam(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", id));
        team.setIsActive(false);
        teamRepository.save(team);
        logger.info("Team soft-deleted: {}", team.getName());
    }

    private TeamDTO toDTO(Team team) {
        long employeeCount = employeeRepository.countByTeamId(team.getId());

        return TeamDTO.builder()
                .id(team.getId())
                .name(team.getName())
                .teamCode(team.getTeamCode())
                .description(team.getDescription())
                .teamLeadId(team.getTeamLead() != null ? team.getTeamLead().getId() : null)
                .teamLeadName(team.getTeamLead() != null ? team.getTeamLead().getName() : null)
                .teamLeadEmail(team.getTeamLead() != null ? team.getTeamLead().getEmail() : null)
                .managerId(team.getManager() != null ? team.getManager().getId() : null)
                .managerName(team.getManager() != null ? team.getManager().getName() : null)
                .managerEmail(team.getManager() != null ? team.getManager().getEmail() : null)
                .emailAlias(team.getEmailAlias())
                .isActive(team.getIsActive())
                .employeeCount(employeeCount)
                .build();
    }
}
