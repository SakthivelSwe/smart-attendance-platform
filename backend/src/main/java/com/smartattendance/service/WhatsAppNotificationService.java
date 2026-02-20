package com.smartattendance.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class WhatsAppNotificationService {

    private final SystemSettingService systemSettingService;
    private static final Logger logger = LoggerFactory.getLogger(WhatsAppNotificationService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Sends a WhatsApp message using the CallMeBot API (Free API).
     * Format:
     * https://api.callmebot.com/whatsapp.php?phone=[phone]&text=[text]&apikey=[apikey]
     */
    public void sendWhatsAppMessage(String message) {
        String phone = systemSettingService.getAdminWhatsAppPhone();
        String apiKey = systemSettingService.getWhatsAppApiKey();

        if (phone == null || apiKey == null) {
            logger.warn("WhatsApp notification skipped: Phone number or API Key not configured.");
            return;
        }

        try {
            String encodedMessage = URLEncoder.encode(message, StandardCharsets.UTF_8);
            String urlStr = String.format("https://api.callmebot.com/whatsapp.php?phone=%s&text=%s&apikey=%s",
                    phone, encodedMessage, apiKey);

            // Use URI object to prevent double-encoding by RestTemplate
            java.net.URI uri = java.net.URI.create(urlStr);

            // Send the request
            String response = restTemplate.getForObject(uri, String.class);
            logger.info("WhatsApp notification sent. Response: {}", response);
        } catch (Exception e) {
            logger.error("Failed to send WhatsApp notification: {}", e.getMessage());
        }
    }
}
