package com.smartattendance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartattendance.dto.LeaveDTO;
import com.smartattendance.service.LeaveService;
import com.smartattendance.security.JwtTokenProvider;
import com.smartattendance.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import com.smartattendance.enums.LeaveStatus;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LeaveController.class)
@AutoConfigureMockMvc(addFilters = false)
public class LeaveControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LeaveService leaveService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getAllLeaves_ShouldReturnList() throws Exception {
        when(leaveService.getAllLeaves()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/leaves"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void applyLeave_ShouldReturnCreated() throws Exception {
        LeaveDTO dto = new LeaveDTO();
        dto.setEmployeeId(1L);
        dto.setStartDate(LocalDate.now());
        dto.setEndDate(LocalDate.now().plusDays(1));
        dto.setReason("Test Leave");

        when(leaveService.applyLeave(any(LeaveDTO.class))).thenReturn(dto);

        mockMvc.perform(post("/api/v1/leaves")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reason").value("Test Leave"));
    }

    @Test
    @WithMockUser(username = "tl@test.com", roles = "TEAM_LEAD")
    void approveByTeamLead_ShouldReturnUpdatedLeave() throws Exception {
        LeaveDTO dto = new LeaveDTO();
        dto.setId(1L);
        dto.setStatus(LeaveStatus.TL_APPROVED);

        when(leaveService.approveByTeamLead(anyLong(), anyString(), any())).thenReturn(dto);

        mockMvc.perform(put("/api/v1/leaves/1/tl-approve")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("remarks", "Looks good"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("TL_APPROVED"));
    }
}
