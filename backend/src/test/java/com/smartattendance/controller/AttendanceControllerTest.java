package com.smartattendance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartattendance.dto.AttendanceDTO;
import com.smartattendance.enums.AttendanceStatus;
import com.smartattendance.security.JwtTokenProvider;
import com.smartattendance.repository.UserRepository;
import com.smartattendance.service.AttendanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.smartattendance.service.GmailService;
import com.smartattendance.repository.GroupRepository;
import com.smartattendance.repository.EmployeeRepository;
import com.smartattendance.service.SystemSettingService;
import com.smartattendance.service.GmailOAuthService;

@WebMvcTest(AttendanceController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AttendanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private AttendanceService attendanceService;

    @MockitoBean
    private GmailService gmailService;

    @MockitoBean
    private GroupRepository groupRepository;

    @MockitoBean
    private EmployeeRepository employeeRepository;

    @MockitoBean
    private SystemSettingService systemSettingService;

    @MockitoBean
    private GmailOAuthService gmailOAuthService;

    @Autowired
    private ObjectMapper objectMapper;

    private AttendanceDTO summaryDTO;

    @BeforeEach
    void setUp() {
        summaryDTO = new AttendanceDTO();
        summaryDTO.setEmployeeId(1L);
        summaryDTO.setEmployeeName("Jane Doe");
        summaryDTO.setDate(LocalDate.now());
        summaryDTO.setStatus(AttendanceStatus.WFO);
    }

    @Test
    void getAttendanceByEmployee_ShouldReturnList() throws Exception {
        when(attendanceService.getAttendanceByEmployeeAndDateRange(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Arrays.asList(summaryDTO));

        mockMvc.perform(get("/api/v1/attendance/employee/1/range")
                .param("start", LocalDate.now().minusDays(1).toString())
                .param("end", LocalDate.now().plusDays(1).toString())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].employeeName").value("Jane Doe"))
                .andExpect(jsonPath("$[0].status").value("WFO"));
    }
}
