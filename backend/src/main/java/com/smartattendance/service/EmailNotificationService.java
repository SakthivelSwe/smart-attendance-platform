package com.smartattendance.service;

import com.smartattendance.dto.AttendanceDTO;
import com.smartattendance.enums.AttendanceStatus;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Properties;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailNotificationService.class);

    private final JavaMailSender defaultMailSender;
    private final SystemSettingService systemSettingService;
    private final GmailOAuthService gmailOAuthService;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    /**
     * Send daily attendance summary email.
     */
    public void sendDailySummaryEmail(List<AttendanceDTO> attendanceList, LocalDate date, String toEmail) {
        String subject = "📊 Daily Attendance Summary - " + date.format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
        String htmlContent = buildSummaryHtml(attendanceList, date);
        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    public void sendReminderToAdmin(String toEmail) {
        String subject = "⚠️ Action Required: Export WhatsApp Chat";
        String html = "<html><body>" +
                "<h2 style='color: #DC2626;'>Attendance Export Missing</h2>" +
                "<p>This is a reminder that the automated attendance processor runs at <b>12:00 PM</b> today.</p>" +
                "<p>We have not yet detected a 'WhatsApp Chat with...' export email in your inbox for today.</p>" +
                "<p><b>Please export the chat from WhatsApp to your email immediately.</b></p>" +
                "<br><p style='color: #6B7280; font-size: 12px;'>—Smart Attendance Platform</p>" +
                "</body></html>";
        sendHtmlEmail(toEmail, subject, html);
    }

    /**
     * Generic method to send any HTML email content.
     * Prefers Gmail API (OAuth2) if connected; falls back to SMTP App Password.
     */
    public void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        // --- Path 1: Gmail API via OAuth2 (preferred — no App Password needed) ---
        if (gmailOAuthService.isConnected()) {
            try {
                gmailOAuthService.sendHtmlEmail(toEmail, subject, htmlContent);
                return;
            } catch (Exception e) {
                logger.error("Gmail API send failed, falling back to SMTP: {}", e.getMessage());
                // Fall through to SMTP path
            }
        }

        // --- Path 2: SMTP with App Password (legacy fallback) ---
        JavaMailSender sender = getSmtpSender();
        String senderEmail = getSmtpSenderEmail();

        if (sender == null || senderEmail == null) {
            logger.warn("Mail not configured (no OAuth2 connection and no SMTP credentials). Skipping email to {}",
                    toEmail);
            throw new RuntimeException("No email provider configured. Please connect a Gmail account in Settings.");
        }

        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            sender.send(message);
            logger.info("Email sent via SMTP: '{}' to {}", subject, toEmail);

        } catch (MailAuthenticationException e) {
            logger.error("SMTP authentication failed for {}: {}", toEmail, e.getMessage());
            throw new RuntimeException(
                    "Gmail App Password is invalid or revoked. Please reconnect your Gmail account in Settings → Connect Gmail Account.",
                    e);
        } catch (MessagingException e) {
            logger.error("Failed to send email '{}' to {}: {}", subject, toEmail, e.getMessage());
            throw new RuntimeException("Email send failed: " + e.getMessage(), e);
        }
    }

    // -----------------------------------------------------------------------
    // SMTP helpers (legacy / fallback)
    // -----------------------------------------------------------------------

    private JavaMailSender getSmtpSender() {
        if (fromEmail != null && !fromEmail.isBlank()) {
            return defaultMailSender;
        }
        String dbEmail = systemSettingService.getGmailEmail();
        String dbPassword = systemSettingService.getGmailPassword();
        if (dbEmail != null && dbPassword != null) {
            return createMailSender(dbEmail, dbPassword);
        }
        return null;
    }

    private String getSmtpSenderEmail() {
        if (fromEmail != null && !fromEmail.isBlank()) {
            return fromEmail;
        }
        return systemSettingService.getGmailEmail();
    }

    private JavaMailSender createMailSender(String email, String password) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost("smtp.gmail.com");
        sender.setPort(587);
        sender.setUsername(email);
        sender.setPassword(password);
        sender.setDefaultEncoding("UTF-8");

        // Log partial password for diagnostics (first 4 chars only)
        String passwordPreview = (password != null && password.length() >= 4)
                ? password.substring(0, 4) + "****"
                : "(empty or null)";
        logger.info("Creating Gmail SMTP sender for {} with password starting: {}", email, passwordPreview);

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        props.put("mail.debug", "true"); // Enable debug to see full SMTP conversation

        return sender;
    }

    private String buildSummaryHtml(List<AttendanceDTO> list, LocalDate date) {
        long wfo = list.stream().filter(a -> a.getStatus() == AttendanceStatus.WFO).count();
        long wfh = list.stream().filter(a -> a.getStatus() == AttendanceStatus.WFH).count();
        long leave = list.stream().filter(a -> a.getStatus() == AttendanceStatus.LEAVE).count();
        long absent = list.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();

        List<String> absentees = list.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.ABSENT)
                .map(AttendanceDTO::getEmployeeName)
                .collect(Collectors.toList());

        StringBuilder html = new StringBuilder();
        html.append("<html><body style='font-family: Arial, sans-serif;'>");
        html.append("<h2 style='color: #4F46E5;'>📊 Attendance Summary - ")
                .append(date.format(DateTimeFormatter.ofPattern("dd MMM yyyy")))
                .append("</h2>");
        html.append("<table style='border-collapse: collapse; width: 100%; max-width: 400px;'>");
        html.append(summaryRow("🏢 WFO", wfo));
        html.append(summaryRow("🏠 WFH", wfh));
        html.append(summaryRow("📋 Leave", leave));
        html.append(summaryRow("❌ Absent", absent));
        html.append(summaryRow("👥 Total", (long) list.size()));
        html.append("</table>");

        if (!absentees.isEmpty()) {
            html.append("<h3 style='color: #DC2626;'>Absentees:</h3><ul>");
            absentees.forEach(name -> html.append("<li>").append(name).append("</li>"));
            html.append("</ul>");
        }

        html.append("<p style='color: #6B7280; font-size: 12px;'>—Smart Attendance Platform</p>");
        html.append("</body></html>");
        return html.toString();
    }

    private String summaryRow(String label, long count) {
        return "<tr>" +
                "<td style='padding: 8px 16px; border-bottom: 1px solid #E5E7EB;'>" + label + "</td>" +
                "<td style='padding: 8px 16px; border-bottom: 1px solid #E5E7EB; font-weight: bold;'>" + count + "</td>"
                +
                "</tr>";
    }
}
