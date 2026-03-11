package com.smartattendance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartattendance.dto.TeamDTO;
import com.smartattendance.entity.User;
import com.smartattendance.enums.UserRole;
import com.smartattendance.security.JwtTokenProvider;
import com.smartattendance.repository.UserRepository;
import com.smartattendance.service.TeamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TeamController.class)
@AutoConfigureMockMvc(addFilters = false)
public class TeamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private TeamService teamService;

    @Autowired
    private ObjectMapper objectMapper;

    private TeamDTO teamDTO;
    private User mockUser;

    @BeforeEach
    void setUp() {
        teamDTO = TeamDTO.builder()
                .id(1L)
                .name("Backend API")
                .teamCode("BA")
                .isActive(true)
                .build();
                
        mockUser = User.builder()
                .id(100L)
                .email("admin@test.com")
                .role(UserRole.ADMIN)
                .build();
    }


    @Test
    void getActiveTeams_ShouldReturnListOfTeams() throws Exception {
        when(teamService.getActiveTeams()).thenReturn(Arrays.asList(teamDTO));

        mockMvc.perform(get("/api/v1/teams/active")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Backend API"));
    }

    @Test
    void getTeamById_WhenValidId_ShouldReturnTeam() throws Exception {
        when(teamService.getTeamById(1L)).thenReturn(teamDTO);

        mockMvc.perform(get("/api/v1/teams/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Backend API"));
    }

    @Test
    void createTeam_WhenValidInput_ShouldReturnCreated() throws Exception {
        when(teamService.createTeam(any(TeamDTO.class))).thenReturn(teamDTO);

        mockMvc.perform(post("/api/v1/teams")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(teamDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Backend API"));
    }

    @Test
    void deleteTeam_ShouldReturnNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/teams/1"))
                .andExpect(status().isNoContent());
    }
}
