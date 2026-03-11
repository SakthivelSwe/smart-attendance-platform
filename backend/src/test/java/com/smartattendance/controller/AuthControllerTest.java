package com.smartattendance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartattendance.dto.AuthRequest;
import com.smartattendance.dto.AuthResponse;
import com.smartattendance.dto.LoginRequest;
import com.smartattendance.dto.RegisterRequest;
import com.smartattendance.enums.UserRole;
import com.smartattendance.security.JwtTokenProvider;
import com.smartattendance.service.AuthService;
import com.smartattendance.service.LoginAttemptService;
import com.smartattendance.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private LoginAttemptService loginAttemptService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void googleLogin_ShouldReturnAuthResponse() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setCredential("test-credential");

        AuthResponse response = AuthResponse.builder()
                .token("test-jwt")
                .email("test@example.com")
                .role(UserRole.USER)
                .build();

        when(authService.authenticateWithGoogle(any(AuthRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("test-jwt"))
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    void login_ShouldReturnAuthResponse() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@test.com");
        request.setPassword("password");

        AuthResponse response = AuthResponse.builder()
                .token("test-jwt")
                .email("user@test.com")
                .role(UserRole.USER)
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("test-jwt"));
    }

    @Test
    void register_ShouldReturnSuccessMessage() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@test.com");
        request.setName("New User");
        request.setPassword("password");

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Verification email sent. Please check your inbox."));
    }

    @Test
    void verifyEmail_ShouldReturnSuccessMessage() throws Exception {
        mockMvc.perform(get("/api/v1/auth/verify")
                .param("token", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(content().string("Email verified successfully. You can now login."));
    }

    @Test
    void healthCheck_ShouldReturnOk() throws Exception {
        mockMvc.perform(get("/api/v1/auth/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));
    }
}
