package com.smartattendance.controller;

import com.smartattendance.dto.DashboardStatsDTO;
import com.smartattendance.service.DashboardService;
import com.smartattendance.service.GeminiService;
import com.smartattendance.security.JwtTokenProvider;
import com.smartattendance.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.core.Authentication;

import java.util.Map;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DashboardController.class)
@AutoConfigureMockMvc(addFilters = false)
public class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DashboardService dashboardService;

    @MockitoBean
    private GeminiService geminiService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void getDashboardStats_ShouldReturnStats() throws Exception {
        DashboardStatsDTO stats = new DashboardStatsDTO();
        stats.setTotalEmployees(100);
        stats.setPresentToday(90);

        when(dashboardService.getDashboardStats()).thenReturn(stats);

        mockMvc.perform(get("/api/v1/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmployees").value(100))
                .andExpect(jsonPath("$.presentToday").value(90));
    }

    @Test
    void getTeamDashboardStats_ShouldReturnStats() throws Exception {
        DashboardStatsDTO stats = new DashboardStatsDTO();
        stats.setTotalEmployees(10);
        stats.setPresentToday(8);

        when(dashboardService.getTeamDashboardStats(1L)).thenReturn(stats);

        mockMvc.perform(get("/api/v1/dashboard/team/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmployees").value(10));
    }

    @Test
    void getInsights_ShouldReturnGeminiInsight() throws Exception {
        DashboardStatsDTO stats = new DashboardStatsDTO();
        when(dashboardService.getDashboardStats()).thenReturn(stats);
        when(geminiService.generateAttendanceInsights(anyString())).thenReturn("Everything looks good.");

        mockMvc.perform(get("/api/v1/dashboard/insights"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.insight").value("Everything looks good."));
    }
}
