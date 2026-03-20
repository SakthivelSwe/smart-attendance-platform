package com.smartattendance.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * KeepAliveScheduler — pings the /api/auth/health endpoint every 11 minutes
 * to prevent Render's free-tier from spinning down the service after 15 minutes
 * of inactivity.
 */
@Component
public class KeepAliveScheduler {

    private static final Logger logger = LoggerFactory.getLogger(KeepAliveScheduler.class);

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Fires every 11 minutes (660,000 ms).
     * Initial delay of 2 minutes gives the application time to fully start up
     * before the first ping is sent.
     */
    @Scheduled(initialDelay = 120_000, fixedRate = 660_000)
    public void keepAlive() {
        String healthUrl = backendUrl + "/api/auth/health";
        try {
            String response = restTemplate.getForObject(healthUrl, String.class);
            logger.info("[KeepAlive] Pinged {} → response: {}", healthUrl, response);
        } catch (Exception e) {
            logger.warn("[KeepAlive] Health ping failed for {}: {}", healthUrl, e.getMessage());
        }
    }
}
