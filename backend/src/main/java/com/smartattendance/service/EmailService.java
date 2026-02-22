package com.smartattendance.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    public void sendVerificationEmail(String to, String token) {
        String subject = "Verify your email - Smart Attendance";
        String verificationUrl = frontendUrl + "/verify-email?token=" + token;

        String content = "<html><body>"
                + "<h2>Welcome to Smart Attendance!</h2>"
                + "<p>Please verify your email address to complete your registration.</p>"
                + "<p><a href=\"" + verificationUrl + "\">Click here to verify</a></p>"
                + "<br><p>This link will expire in 1 hour.</p>"
                + "<p>If you didn't request this, please ignore this email.</p>"
                + "</body></html>";

        sendEmail(to, subject, content);
    }

    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Password Reset Request - Smart Attendance";
        String resetUrl = frontendUrl + "/reset-password?token=" + token;

        String content = "<html><body>"
                + "<h2>Password Reset</h2>"
                + "<p>You have requested to reset your password.</p>"
                + "<p><a href=\"" + resetUrl + "\">Click here to reset your password</a></p>"
                + "<br><p>This link will expire in 1 hour.</p>"
                + "<p>If you didn't request this, please ignore this email.</p>"
                + "</body></html>";

        sendEmail(to, subject, content);
    }

    private void sendEmail(String to, String subject, String content) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail.isEmpty() ? "noreply@smartattendance.com" : fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);

            javaMailSender.send(message);
            logger.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email to: {}", to, e);
            if ("dev".equalsIgnoreCase(activeProfile)) {
                logger.warn("Suppressing email sending failure for local development testing.");
            } else {
                throw new RuntimeException("Failed to dispatch email. Please check the mail server configuration.", e);
            }
        }
    }
}
