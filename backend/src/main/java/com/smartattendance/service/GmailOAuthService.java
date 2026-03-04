package com.smartattendance.service;

import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.UserCredentials;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Date;
import java.util.Properties;

/**
 * Gmail OAuth2 service — uses the Google OAuth2 Authorization Code Flow.
 * Allows sending emails via Gmail API without App Passwords.
 * The admin does a one-time "Connect Gmail Account" via Google Sign-In;
 * the refresh token is stored encrypted in system_settings
 * (GMAIL_REFRESH_TOKEN).
 */
@Service
@RequiredArgsConstructor
public class GmailOAuthService {

    private static final Logger logger = LoggerFactory.getLogger(GmailOAuthService.class);

    private static final String APPLICATION_NAME = "Smart Attendance Platform";
    private static final String TOKEN_SERVER_URL = "https://oauth2.googleapis.com/token";
    private static final String AUTH_SERVER_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
    private static final String GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
    private static final String USERINFO_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";
    private static final String SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

    // Keys used to persist OAuth2 tokens in system_settings
    static final String REFRESH_TOKEN_KEY = "GMAIL_OAUTH_REFRESH_TOKEN";
    static final String CONNECTED_EMAIL_KEY = "GMAIL_OAUTH_EMAIL";

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    private final SystemSettingService systemSettingService;
    private final EncryptionService encryptionService;

    // -----------------------------------------------------------------------
    // OAuth2 Authorization URL
    // -----------------------------------------------------------------------

    /**
     * Build the Google OAuth2 authorization URL that the admin navigates to.
     * Returns an absolute URL to redirect the frontend browser to.
     */
    public String buildAuthorizationUrl() {
        String redirectUri = backendUrl + "/api/settings/gmail/oauth/callback";
        return UriComponentsBuilder.fromUri(java.net.URI.create(AUTH_SERVER_URL))
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope",
                        GMAIL_SEND_SCOPE + " " + GMAIL_READONLY_SCOPE + " " + USERINFO_EMAIL_SCOPE + " " + SHEETS_SCOPE)
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent") // Forces re-consent so we always get a refresh token
                .toUriString();
    }

    // -----------------------------------------------------------------------
    // Exchange auth code → tokens, store refresh token
    // -----------------------------------------------------------------------

    /**
     * Exchange the authorization code from Google for tokens.
     * Stores the refresh token (encrypted) and the connected email in
     * system_settings.
     */
    public String handleOAuthCallback(String code) throws IOException {
        String redirectUri = backendUrl + "/api/settings/gmail/oauth/callback";

        // Exchange code for tokens using Google's token endpoint
        com.google.api.client.http.GenericUrl tokenUrl = new com.google.api.client.http.GenericUrl(TOKEN_SERVER_URL);
        com.google.api.client.auth.oauth2.AuthorizationCodeTokenRequest tokenRequest = new com.google.api.client.auth.oauth2.AuthorizationCodeTokenRequest(
                new com.google.api.client.http.javanet.NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                tokenUrl,
                code)
                .setRedirectUri(redirectUri)
                .setClientAuthentication(
                        new com.google.api.client.auth.oauth2.ClientParametersAuthentication(
                                clientId, clientSecret));

        com.google.api.client.auth.oauth2.TokenResponse tokenResponse = tokenRequest.execute();

        String refreshToken = tokenResponse.getRefreshToken();
        String accessToken = tokenResponse.getAccessToken();

        if (refreshToken == null) {
            throw new IllegalStateException(
                    "No refresh token returned from Google. Please revoke access at https://myaccount.google.com/permissions and try again.");
        }

        // Get the connected email from the userinfo endpoint
        String connectedEmail = fetchEmailFromAccessToken(accessToken);

        // Store encrypted refresh token + email
        systemSettingService.saveOAuthTokens(connectedEmail, encryptionService.encrypt(refreshToken));
        logger.info("Gmail OAuth2 connected successfully for: {}", connectedEmail);

        return connectedEmail;
    }

    // -----------------------------------------------------------------------
    // Send email via Gmail API
    // -----------------------------------------------------------------------

    /**
     * Send an HTML email using the Gmail API (OAuth2 — no App Password required).
     * Throws RuntimeException if not connected or if sending fails.
     */
    public void sendHtmlEmail(String toEmail, String subject, String htmlBody) throws IOException, MessagingException {
        Gmail gmailService = buildGmailService();
        String senderEmail = systemSettingService.getOAuthConnectedEmail();

        MimeMessage mimeMessage = buildMimeMessage(senderEmail, toEmail, subject, htmlBody);
        Message message = encodeMimeMessage(mimeMessage);

        gmailService.users().messages().send("me", message).execute();
        logger.info("Email sent via Gmail API from {} to {}: '{}'", senderEmail, toEmail, subject);
    }

    // -----------------------------------------------------------------------
    // Fetch and read emails via Gmail API
    // -----------------------------------------------------------------------

    public java.util.List<java.util.Map<String, String>> listRecentEmails(String subjectPattern, int maxResults) {
        java.util.List<java.util.Map<String, String>> results = new java.util.ArrayList<>();
        try {
            Gmail gmailService = buildGmailService();
            String cleanSubject = subjectPattern.replace("*", "").replace("%", "").trim();
            String query = "subject:\"" + cleanSubject + "\"";

            com.google.api.services.gmail.model.ListMessagesResponse listResponse = gmailService.users().messages()
                    .list("me").setQ(query).setMaxResults(Long.valueOf(maxResults)).execute();

            java.util.List<Message> messages = listResponse.getMessages();
            if (messages != null) {
                for (Message msgMetadata : messages) {
                    Message msg = gmailService.users().messages().get("me", msgMetadata.getId()).setFormat("metadata")
                            .execute();
                    java.util.Map<String, String> emailInfo = new java.util.HashMap<>();

                    String subject = "Unknown";
                    String from = "Unknown";
                    String dateStr = "Unknown";

                    if (msg.getPayload() != null && msg.getPayload().getHeaders() != null) {
                        for (com.google.api.services.gmail.model.MessagePartHeader header : msg.getPayload()
                                .getHeaders()) {
                            if ("Subject".equalsIgnoreCase(header.getName()))
                                subject = header.getValue();
                            if ("From".equalsIgnoreCase(header.getName()))
                                from = header.getValue();
                            if ("Date".equalsIgnoreCase(header.getName()))
                                dateStr = header.getValue();
                        }
                    }

                    emailInfo.put("subject", subject);
                    emailInfo.put("from", from);
                    emailInfo.put("date", dateStr);
                    results.add(emailInfo);
                }
            }
        } catch (Exception e) {
            logger.error("Error listing emails via OAuth2: {}", e.getMessage());
        }
        return results;
    }

    public String fetchAttendanceEmailForDate(String subjectPattern, java.time.LocalDate targetDate) throws Exception {
        Gmail gmailService = buildGmailService();
        String userId = "me";

        String cleanSubject = subjectPattern.replace("*", "").replace("%", "").trim();
        java.time.LocalDate fromDate = targetDate != null ? targetDate : java.time.LocalDate.now().minusDays(1);
        String dateStr = fromDate.format(java.time.format.DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String query = "subject:\"" + cleanSubject + "\" after:" + dateStr;

        logger.info("Querying Gmail API: {}", query);

        com.google.api.services.gmail.model.ListMessagesResponse listResponse = gmailService.users().messages()
                .list(userId).setQ(query).execute();

        java.util.List<Message> messages = listResponse.getMessages();
        if (messages == null || messages.isEmpty()) {
            logger.info("No emails found matching query '{}'.", query);
            return null;
        }

        for (Message msgMetadata : messages) {
            Message msg = gmailService.users().messages()
                    .get(userId, msgMetadata.getId()).setFormat("full").execute();

            String text = extractChatFromGmailMessage(gmailService, userId, msg);
            if (text != null)
                return text;
        }
        return null;
    }

    private String extractChatFromGmailMessage(Gmail gmailService, String userId, Message msg) throws Exception {
        if (msg.getPayload() == null)
            return null;

        // Handle direct payload (very rare for attachments, but possible)
        String body = extractFromParts(gmailService, userId, msg.getId(),
                java.util.Collections.singletonList(msg.getPayload()));
        if (body != null)
            return body;

        return extractFromParts(gmailService, userId, msg.getId(), msg.getPayload().getParts());
    }

    private String extractFromParts(Gmail gmailService, String userId, String messageId,
            java.util.List<com.google.api.services.gmail.model.MessagePart> parts) throws Exception {
        if (parts == null)
            return null;
        for (com.google.api.services.gmail.model.MessagePart part : parts) {
            String filename = part.getFilename();
            if (filename != null && !filename.isEmpty()) {
                if (filename.toLowerCase().endsWith(".zip") || filename.toLowerCase().endsWith(".txt")) {
                    String attachmentId = part.getBody().getAttachmentId();
                    if (attachmentId != null) {
                        com.google.api.services.gmail.model.MessagePartBody attachment = gmailService.users().messages()
                                .attachments().get(userId, messageId, attachmentId).execute();
                        byte[] data = java.util.Base64.getUrlDecoder().decode(attachment.getData());
                        logger.info("Downloaded attachment '{}' from Gmail API", filename);
                        if (filename.toLowerCase().endsWith(".zip")) {
                            return extractTextFromZipBytes(data);
                        } else {
                            return new String(data, java.nio.charset.StandardCharsets.UTF_8);
                        }
                    } else if (part.getBody().getData() != null) {
                        // Sometimes small attachments are inline in the data field
                        byte[] data = java.util.Base64.getUrlDecoder().decode(part.getBody().getData());
                        if (filename.toLowerCase().endsWith(".zip")) {
                            return extractTextFromZipBytes(data);
                        } else {
                            return new String(data, java.nio.charset.StandardCharsets.UTF_8);
                        }
                    }
                }
            }
            if (part.getParts() != null) {
                String nested = extractFromParts(gmailService, userId, messageId, part.getParts());
                if (nested != null)
                    return nested;
            }
        }
        return null;
    }

    private String extractTextFromZipBytes(byte[] zipBytes) {
        try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(
                new java.io.ByteArrayInputStream(zipBytes), java.nio.charset.StandardCharsets.UTF_8)) {
            java.util.zip.ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (!entry.isDirectory() && entry.getName().toLowerCase().endsWith(".txt")) {
                    byte[] bytes = zis.readAllBytes();
                    zis.closeEntry();
                    return new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
                }
                zis.closeEntry();
            }
        } catch (Exception e) {
            logger.error("Error extracting zip bytes: {}", e.getMessage());
        }
        return null;
    }

    // -----------------------------------------------------------------------
    // Connection status
    // -----------------------------------------------------------------------

    public boolean isConnected() {
        return systemSettingService.getOAuthRefreshToken() != null
                && systemSettingService.getOAuthConnectedEmail() != null;
    }

    public String getConnectedEmail() {
        return systemSettingService.getOAuthConnectedEmail();
    }

    public void disconnect() {
        systemSettingService.clearOAuthTokens();
    }

    /**
     * Gets the OAuth2 credentials for the connected Google account.
     * Returns null if not connected or if decryption fails.
     */
    public UserCredentials getGoogleCredentials() {
        String encryptedRefreshToken = systemSettingService.getOAuthRefreshToken();
        if (encryptedRefreshToken == null) {
            return null;
        }
        String refreshToken = encryptionService.decrypt(encryptedRefreshToken);
        if (refreshToken == null) {
            return null;
        }

        return UserCredentials.newBuilder()
                .setClientId(clientId)
                .setClientSecret(clientSecret)
                .setRefreshToken(refreshToken)
                .build();
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private Gmail buildGmailService() throws IOException {
        UserCredentials credentials = getGoogleCredentials();
        if (credentials == null) {
            throw new IllegalStateException(
                    "Gmail account is not connected or token is invalid. Please connect a Gmail account in Settings.");
        }

        return new Gmail.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    private String fetchEmailFromAccessToken(String accessToken) {
        try {
            GoogleCredentials credentials = GoogleCredentials.create(new AccessToken(accessToken, null));
            com.google.api.client.http.HttpTransport transport = new NetHttpTransport();
            com.google.api.client.http.HttpRequestFactory factory = transport
                    .createRequestFactory(new HttpCredentialsAdapter(credentials));
            com.google.api.client.http.HttpRequest req = factory.buildGetRequest(
                    new com.google.api.client.http.GenericUrl("https://www.googleapis.com/oauth2/v2/userinfo"));
            com.google.api.client.http.HttpResponse resp = req.execute();
            com.google.api.client.json.JsonFactory jsonFactory = GsonFactory.getDefaultInstance();
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> json = jsonFactory.fromReader(
                    new java.io.InputStreamReader(resp.getContent()), java.util.Map.class);
            return (String) json.get("email");
        } catch (Exception e) {
            logger.warn("Could not fetch email from access token: {}", e.getMessage());
            return "unknown@gmail.com";
        }
    }

    private MimeMessage buildMimeMessage(String from, String to, String subject, String htmlBody)
            throws MessagingException {
        Properties props = new Properties();
        Session session = Session.getDefaultInstance(props, null);
        MimeMessage mimeMessage = new MimeMessage(session);
        mimeMessage.setFrom(new InternetAddress(from));
        mimeMessage.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));
        mimeMessage.setSubject(subject, "UTF-8");
        mimeMessage.setContent(htmlBody, "text/html; charset=utf-8");
        mimeMessage.setSentDate(new Date());
        return mimeMessage;
    }

    private Message encodeMimeMessage(MimeMessage mimeMessage) throws IOException, MessagingException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        mimeMessage.writeTo(baos);
        String encoded = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(baos.toByteArray());
        Message message = new Message();
        message.setRaw(encoded);
        return message;
    }
}
