package com.smartattendance.service;

import jakarta.mail.*;
import jakarta.mail.internet.MimeMultipart;
import jakarta.mail.search.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.zip.ZipEntry;
import com.smartattendance.dto.EmailData;
import java.util.zip.ZipInputStream;

/**
 * Gmail integration service to read WhatsApp export emails via IMAP.
 * Credentials are provided per-request by the logged-in admin user.
 * No credentials are stored on the server.
 */
@Service
public class GmailService {

    private static final Logger logger = LoggerFactory.getLogger(GmailService.class);
    private static final String IMAP_HOST = "imap.gmail.com";
    private static final int IMAP_PORT = 993;

    /**
     * Check if credentials are provided (always true since admin provides them per
     * request).
     */
    public boolean isConfigured() {
        return true;
    }

    /**
     * Fetch the latest WhatsApp chat email for a given subject pattern.
     * Uses admin-provided credentials for IMAP connection.
     *
     * @param gmailEmail          Admin's Gmail email address
     * @param gmailAppPassword    Admin's Gmail App Password
     * @param emailSubjectPattern Email subject pattern to search for
     * @return Extracted EmailData, or null if not found
     */
    public EmailData fetchLatestAttendanceEmail(String gmailEmail, String gmailAppPassword, String emailSubjectPattern) {
        try {
            return fetchEmailWithRetry(gmailEmail, gmailAppPassword, emailSubjectPattern, null);
        } catch (Exception e) {
            logger.error("Failed to fetch email: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Fetch WhatsApp chat text from email for a specific date.
     *
     * @param gmailEmail          Admin's Gmail email
     * @param gmailAppPassword    Admin's Gmail App Password
     * @param emailSubjectPattern Subject pattern to match
     * @param targetDate          Date to search from
     * @return Extracted EmailData, or null if not found
     */
    public EmailData fetchAttendanceEmailForDate(String gmailEmail, String gmailAppPassword,
            String emailSubjectPattern, LocalDate targetDate) throws Exception {
        return fetchEmailWithRetry(gmailEmail, gmailAppPassword, emailSubjectPattern, targetDate);
    }

    /**
     * List recent WhatsApp chat emails matching a subject pattern.
     *
     * @param gmailEmail       Admin's Gmail email
     * @param gmailAppPassword Admin's Gmail App Password
     * @param subjectPattern   Subject pattern to match
     * @param maxResults       Maximum results to return
     * @return List of email metadata
     */
    public List<Map<String, String>> listRecentEmails(String gmailEmail, String gmailAppPassword,
            String subjectPattern, int maxResults) {
        List<Map<String, String>> results = new ArrayList<>();

        try {
            Session session = createSession();
            Store store = session.getStore("imaps");
            store.connect(IMAP_HOST, IMAP_PORT, gmailEmail, gmailAppPassword);
            Folder inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_ONLY);

            SearchTerm searchTerm = buildSearchTerm(subjectPattern, null);
            Message[] messages = inbox.search(searchTerm);

            if (messages.length > 0) {
                jakarta.mail.FetchProfile fp = new jakarta.mail.FetchProfile();
                fp.add(jakarta.mail.FetchProfile.Item.ENVELOPE);
                inbox.fetch(messages, fp);
            }

            int startIdx = Math.max(0, messages.length - maxResults);
            for (int i = messages.length - 1; i >= startIdx; i--) {
                Message msg = messages[i];
                Map<String, String> emailInfo = new HashMap<>();
                emailInfo.put("subject", msg.getSubject());
                emailInfo.put("from", msg.getFrom() != null && msg.getFrom().length > 0
                        ? msg.getFrom()[0].toString()
                        : "Unknown");
                emailInfo.put("date", msg.getSentDate() != null ? msg.getSentDate().toString() : "Unknown");
                results.add(emailInfo);
            }

            inbox.close(false);
            store.close();
        } catch (Exception e) {
            logger.error("Error listing emails: {}", e.getMessage());
        }

        return results;
    }

    /**
     * Check if a WhatsApp export email exists for the given date.
     */
    public boolean hasAttendanceEmailForDate(String gmailEmail, String gmailAppPassword,
            String emailSubjectPattern, LocalDate targetDate) throws Exception {
        Session session = createSession();
        Store store = null;
        Folder inbox = null;

        try {
            store = session.getStore("imaps");
            store.connect(IMAP_HOST, IMAP_PORT, gmailEmail, gmailAppPassword);

            inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_ONLY);

            SearchTerm searchTerm = buildSearchTerm(emailSubjectPattern, targetDate);
            Message[] messages = inbox.search(searchTerm);

            if (messages.length > 0) {
                jakarta.mail.FetchProfile fp = new jakarta.mail.FetchProfile();
                fp.add(jakarta.mail.FetchProfile.Item.ENVELOPE);
                inbox.fetch(messages, fp);
            }

            return messages.length > 0;

        } catch (Exception e) {
            logger.error("Error checking email existence: {}", e.getMessage());
            return false;
        } finally {
            if (inbox != null && inbox.isOpen()) {
                try {
                    inbox.close(false);
                } catch (Exception ignored) {
                }
            }
            if (store != null && store.isConnected()) {
                try {
                    store.close();
                } catch (Exception ignored) {
                }
            }
        }
    }

    // ==================== Private Methods ====================

    private EmailData fetchEmailWithRetry(String email, String password,
            String subjectPattern, LocalDate targetDate) throws Exception {
        int maxRetries = 2;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return doFetchEmail(email, password, subjectPattern, targetDate);
            } catch (AuthenticationFailedException e) {
                logger.error("Gmail authentication failed. Check email/app password.");
                throw e;
            } catch (MessagingException e) {
                logger.warn("Attempt {}/{} failed: {}", attempt, maxRetries, e.getMessage());
                if (attempt == maxRetries)
                    throw e;
                Thread.sleep(2000);
            }
        }
        return null;
    }

    private EmailData doFetchEmail(String email, String password,
            String subjectPattern, LocalDate targetDate) throws Exception {
        Session session = createSession();
        Store store = null;
        Folder inbox = null;

        try {
            store = session.getStore("imaps");
            logger.info("Connecting to Gmail IMAP at {}:{} as {}...", IMAP_HOST, IMAP_PORT, email);

            // Log connection attempt without password
            try {
                store.connect(IMAP_HOST, IMAP_PORT, email, password);
                logger.info("Connection established successfully.");
            } catch (AuthenticationFailedException e) {
                logger.error("Authentication failed for {}. check App Password.", email);
                throw new Exception(
                        "Gmail Authentication Failed: Please check your Email and App Password. " +
                                "IMPORTANT: You MUST use a 16-character 'App Password' from Google Account Settings, " +
                                "not your regular Gmail password.");
            } catch (MessagingException e) {
                logger.error("Messaging exception during connection to {}: {}", IMAP_HOST, e.getMessage());
                String technicalDetail = e.getMessage() != null ? e.getMessage() : "Unknown technical error";
                throw new Exception("Connection to Gmail failed (" + technicalDetail + "). " +
                        "Please ensure 'IMAP Access' is ENABLED in your Gmail Settings -> Forwarding and POP/IMAP.");
            } catch (Exception e) {
                logger.error("Unexpected error during IMAP connection: {}", e.getMessage());
                throw new Exception("Unexpected error connecting to Gmail: " + e.getMessage());
            }

            inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_ONLY);

            SearchTerm searchTerm = buildSearchTerm(subjectPattern, targetDate);
            Message[] messages = inbox.search(searchTerm);
            logger.info("Found {} emails matching pattern '{}'", messages.length, subjectPattern);

            if (messages.length == 0) {
                return null;
            }

            // Bulk prefetch envelope headers to prevent network roundtrip per message
            jakarta.mail.FetchProfile fp = new jakarta.mail.FetchProfile();
            fp.add(jakarta.mail.FetchProfile.Item.ENVELOPE);
            inbox.fetch(messages, fp);

            // Iterate from newest to oldest to find the first one with a valid chat
            // attachment
            EmailData bestResult = null;
            for (int i = messages.length - 1; i >= 0; i--) {
                Message msg = messages[i];
                logger.info("Checking email {}/{}: Subject='{}', Date={}",
                        i + 1, messages.length, msg.getSubject(), msg.getSentDate());

                try {
                    EmailData emailData = extractEmailData(msg);
                    if (emailData != null && (emailData.getChatText() != null && !emailData.getChatText().isBlank())) {
                        logger.info("Found valid chat attachment in email: {}", msg.getSubject());
                        logger.info("Extracted chat text ({} characters)", emailData.getChatText().length());
                        bestResult = emailData;
                        break;
                    } else {
                        logger.warn("No chat text found in email: {}. Checking next...", msg.getSubject());
                    }
                } catch (Exception e) {
                    logger.error("Error extracting from email {}: {}", msg.getSubject(), e.getMessage());
                }
            }

            // If we found chat text but no VCF, search for the most recent VCF in the
            // entire inbox (no date filter — VCF contacts rarely change)
            if (bestResult != null && bestResult.getVcfText() == null) {
                logger.info("Chat found but VCF missing. Searching for most recent VCF in inbox...");
                try {
                    // Search all emails for .vcf attachments (no date restriction)
                    Message[] allMessages = inbox.search(new SubjectTerm(""));
                    // Scan from newest to oldest, limited to last 50 emails for performance
                    int scanStart = Math.max(0, allMessages.length - 50);
                    for (int i = allMessages.length - 1; i >= scanStart; i--) {
                        try {
                            EmailData vcfData = extractEmailData(allMessages[i]);
                            if (vcfData != null && vcfData.getVcfText() != null && !vcfData.getVcfText().isBlank()) {
                                logger.info("Found VCF from previous email (reusing most recent VCF). Subject: {}",
                                        allMessages[i].getSubject());
                                bestResult.setVcfText(vcfData.getVcfText());
                                break;
                            }
                        } catch (Exception e) {
                            // Skip problematic emails
                        }
                    }
                    if (bestResult.getVcfText() == null) {
                        logger.info("No VCF files found in recent inbox emails.");
                    }
                } catch (Exception e) {
                    logger.warn("Failed to search for VCF fallback: {}", e.getMessage());
                }
            }

            if (bestResult != null) {
                return bestResult;
            }

            logger.warn("No valid chat attachment found in any of the {} matching emails.", messages.length);
            return null;

        } finally {
            if (inbox != null && inbox.isOpen()) {
                try {
                    inbox.close(false);
                } catch (Exception ignored) {
                }
            }
            if (store != null && store.isConnected()) {
                try {
                    store.close();
                } catch (Exception ignored) {
                }
            }
        }
    }

    private Session createSession() {
        Properties props = new Properties();
        props.put("mail.store.protocol", "imaps");
        props.put("mail.imaps.host", IMAP_HOST);
        props.put("mail.imaps.port", String.valueOf(IMAP_PORT));
        props.put("mail.imaps.ssl.enable", "true");
        props.put("mail.imaps.ssl.trust", IMAP_HOST);
        props.put("mail.imaps.starttls.enable", "true");
        props.put("mail.imaps.connectiontimeout", "30000");
        props.put("mail.imaps.timeout", "30000");

        // Critical for large attachments and robust connection
        props.put("mail.imaps.partialfetch", "false");
        props.put("mail.imaps.fetchsize", "1048576"); // 1MB buffer

        return Session.getInstance(props);
    }

    private SearchTerm buildSearchTerm(String subjectPattern, LocalDate targetDate) {
        String cleanSubject = subjectPattern.replace("*", "").replace("%", "").trim();
        SearchTerm subjectTerm = new SubjectTerm(cleanSubject);

        // Optimize search window:
        LocalDate fromDate = targetDate != null ? targetDate : LocalDate.now().minusDays(1);
        Date startDate = Date.from(fromDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
        SearchTerm dateTerm = new ReceivedDateTerm(ComparisonTerm.GE, startDate);

        // Cap the maximum search window to 2 days after the target date to avoid
        // scanning years of emails
        LocalDate toDate = fromDate.plusDays(3);
        Date endDate = Date.from(toDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
        SearchTerm maxDateTerm = new ReceivedDateTerm(ComparisonTerm.LE, endDate);

        SearchTerm boundedDateTerm = new AndTerm(dateTerm, maxDateTerm);

        return new AndTerm(subjectTerm, boundedDateTerm);
    }

    private EmailData extractEmailData(Message message) throws Exception {
        Object content = message.getContent();

        if (content instanceof MimeMultipart multipart) {
            return extractFromMultipart(multipart);
        } else if (content instanceof String text) {
            return new EmailData(text, null);
        }

        logger.warn("Unsupported email content type: {}", content.getClass().getName());
        return null;
    }

    private EmailData extractFromMultipart(MimeMultipart multipart) throws Exception {
        EmailData data = new EmailData();

        for (int i = 0; i < multipart.getCount(); i++) {
            BodyPart part = multipart.getBodyPart(i);
            String disposition = part.getDisposition();
            String contentType = part.getContentType().toLowerCase();

            if (disposition != null && (disposition.equalsIgnoreCase(Part.ATTACHMENT)
                    || disposition.equalsIgnoreCase(Part.INLINE))) {

                String filename = part.getFileName();
                if (filename != null) {
                    filename = jakarta.mail.internet.MimeUtility.decodeText(filename);
                    logger.info("Found attachment: {} (type: {})", filename, contentType);

                    if (filename.toLowerCase().endsWith(".zip") ||
                            contentType.contains("zip") || contentType.contains("compressed")) {
                        EmailData zipData = extractDataFromZip(part.getInputStream());
                        if (zipData != null) {
                            if (zipData.getChatText() != null) data.setChatText(zipData.getChatText());
                            if (zipData.getVcfText() != null) data.setVcfText(zipData.getVcfText());
                        }
                    } else if (filename.toLowerCase().endsWith(".txt")) {
                        data.setChatText(new String(part.getInputStream().readAllBytes(), StandardCharsets.UTF_8));
                    } else if (filename.toLowerCase().endsWith(".vcf")) {
                        data.setVcfText(new String(part.getInputStream().readAllBytes(), StandardCharsets.UTF_8));
                    }
                }
            }

            if (part.getContent() instanceof MimeMultipart nestedMultipart) {
                EmailData nested = extractFromMultipart(nestedMultipart);
                if (nested != null) {
                    if (nested.getChatText() != null) data.setChatText(nested.getChatText());
                    if (nested.getVcfText() != null) data.setVcfText(nested.getVcfText());
                }
            }

            if (contentType.contains("text/plain") && disposition == null) {
                if (data.getChatText() == null) {
                    data.setChatText((String) part.getContent());
                }
            }
        }

        if (data.getChatText() != null || data.getVcfText() != null) {
            return data;
        }
        return null;
    }

    private EmailData extractDataFromZip(InputStream zipStream) {
        EmailData zipData = new EmailData();
        try (ZipInputStream zis = new ZipInputStream(zipStream, StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String entryName = entry.getName();
                
                if (!entry.isDirectory()) {
                    if (entryName.toLowerCase().endsWith(".txt")) {
                        byte[] bytes = zis.readAllBytes();
                        String text = new String(bytes, StandardCharsets.UTF_8);
                        logger.info("Extracted '{}' ({} characters)", entryName, text.length());
                        zipData.setChatText(text);
                    } else if (entryName.toLowerCase().endsWith(".vcf")) {
                        byte[] bytes = zis.readAllBytes();
                        String vcfContent = new String(bytes, StandardCharsets.UTF_8);
                        logger.info("Extracted VCF '{}' ({} characters)", entryName, vcfContent.length());
                        if (zipData.getVcfText() == null) {
                            zipData.setVcfText(vcfContent);
                        } else {
                            zipData.setVcfText(zipData.getVcfText() + "\n" + vcfContent);
                        }
                    }
                }
                zis.closeEntry();
            }
        } catch (IOException e) {
            logger.error("Error extracting zip: {}", e.getMessage(), e);
        }
        return (zipData.getChatText() != null || zipData.getVcfText() != null) ? zipData : null;
    }
}
