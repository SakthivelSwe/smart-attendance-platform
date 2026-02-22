package com.smartattendance.controller;

import com.smartattendance.dto.AuthRequest;
import com.smartattendance.dto.AuthResponse;
import com.smartattendance.entity.User;
import com.smartattendance.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody AuthRequest request) {
        AuthResponse response = authService.authenticateWithGoogle(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        AuthResponse response = AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody com.smartattendance.dto.RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok("Verification email sent. Please check your inbox.");
    }

    @GetMapping("/verify")
    public ResponseEntity<String> verifyEmail(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok("Email verified successfully. You can now login.");
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody com.smartattendance.dto.LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody com.smartattendance.dto.ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok("Password reset link sent to your email.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody com.smartattendance.dto.ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok("Password reset successfully. You can now login.");
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<String> resendVerification(@RequestParam("email") String email) {
        authService.resendVerification(email);
        return ResponseEntity.ok("Verification email resent.");
    }

    @GetMapping("/dev/token")
    public ResponseEntity<String> getDevToken(@RequestParam("email") String email) {
        return ResponseEntity.ok(authService.getVerificationTokenForTesting(email));
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("OK");
    }
}
