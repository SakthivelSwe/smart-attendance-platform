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
    private static final String USERINFO_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";

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
                .queryParam("scope", GMAIL_SEND_SCOPE + " " + USERINFO_EMAIL_SCOPE)
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

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private Gmail buildGmailService() throws IOException {
        String encryptedRefreshToken = systemSettingService.getOAuthRefreshToken();
        if (encryptedRefreshToken == null) {
            throw new IllegalStateException(
                    "Gmail account is not connected. Please connect a Gmail account in Settings.");
        }
        String refreshToken = encryptionService.decrypt(encryptedRefreshToken);
        if (refreshToken == null) {
            throw new IllegalStateException(
                    "Failed to decrypt stored refresh token. Please reconnect your Gmail account.");
        }

        UserCredentials credentials = UserCredentials.newBuilder()
                .setClientId(clientId)
                .setClientSecret(clientSecret)
                .setRefreshToken(refreshToken)
                .build();

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
