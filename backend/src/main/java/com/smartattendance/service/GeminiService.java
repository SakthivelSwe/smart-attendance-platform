package com.smartattendance.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiService {

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateAttendanceInsights(String dataSummary) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return "Gemini AI Insights require an API key to be configured in your environment variables as GEMINI_API_KEY. Once configured, you will receive smart analysis of your team's attendance trends here.";
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
                + apiKey;

        try {
            String prompt = "You are an HR Analytics AI. Analyze this smart attendance data summary for today and provide a brief, professional, and encouraging 2-sentence insight about the attendance trends. Do not use markdown or formatting, just plain text.\n\nData:\n"
                    + dataSummary;

            Map<String, Object> requestBody = new HashMap<>();

            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(part));

            requestBody.put("contents", List.of(content));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entityStr = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);

            String response = restTemplate.postForObject(url, entityStr, String.class);

            // Parse response
            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode textNode = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text");
            return textNode.asText().trim();

        } catch (Exception e) {
            log.error("Error calling Gemini API: {}", e.getMessage());
            return "Unable to generate insights at this time due to an AI service connection issue.";
        }
    }
}
