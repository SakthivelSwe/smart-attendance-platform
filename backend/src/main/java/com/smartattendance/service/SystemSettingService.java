package com.smartattendance.service;

import com.smartattendance.entity.SystemSetting;
import com.smartattendance.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;

@Service
@RequiredArgsConstructor
public class SystemSettingService {

    private final SystemSettingRepository repository;
    private static final String GMAIL_EMAIL_KEY = "GMAIL_EMAIL";
    private static final String GMAIL_PASSWORD_KEY = "GMAIL_PASSWORD";
    private static final String ADMIN_WHATSAPP_PHONE_KEY = "ADMIN_WHATSAPP_PHONE";
    private static final String WHATSAPP_API_KEY_KEY = "WHATSAPP_API_KEY";
    private static final String EMAIL_REMINDER_ENABLED_KEY = "EMAIL_REMINDER_ENABLED";
    private static final String WHATSAPP_REMINDER_ENABLED_KEY = "WHATSAPP_REMINDER_ENABLED";
    private static final String SCHEDULER_REMINDER_TIME_KEY = "SCHEDULER_REMINDER_TIME";
    private static final String SCHEDULER_PROCESSING_TIME_KEY = "SCHEDULER_PROCESSING_TIME";

    public String getGmailEmail() {
        return repository.findBySettingKey(GMAIL_EMAIL_KEY)
                .map(SystemSetting::getSettingValue)
                .orElse(null);
    }

    public String getGmailPassword() {
        return repository.findBySettingKey(GMAIL_PASSWORD_KEY)
                .map(s -> decrypt(s.getSettingValue()))
                .orElse(null);
    }

    public String getAdminWhatsAppPhone() {
        return repository.findBySettingKey(ADMIN_WHATSAPP_PHONE_KEY)
                .map(SystemSetting::getSettingValue)
                .orElse(null);
    }

    public String getWhatsAppApiKey() {
        return repository.findBySettingKey(WHATSAPP_API_KEY_KEY)
                .map(SystemSetting::getSettingValue) // API keys might be sensitive, but for now treating as plain text
                                                     // or we can encrypt
                .orElse(null);
    }

    public boolean isEmailReminderEnabled() {
        return repository.findBySettingKey(EMAIL_REMINDER_ENABLED_KEY)
                .map(s -> Boolean.parseBoolean(s.getSettingValue()))
                .orElse(true); // Default email ON
    }

    public boolean isWhatsAppReminderEnabled() {
        return repository.findBySettingKey(WHATSAPP_REMINDER_ENABLED_KEY)
                .map(s -> Boolean.parseBoolean(s.getSettingValue()))
                .orElse(false); // Default whatsapp OFF
    }

    public String getSchedulerReminderTime() {
        return repository.findBySettingKey(SCHEDULER_REMINDER_TIME_KEY)
                .map(SystemSetting::getSettingValue)
                .orElse("11:30"); // Default 11:30 AM
    }

    public String getSchedulerProcessingTime() {
        return repository.findBySettingKey(SCHEDULER_PROCESSING_TIME_KEY)
                .map(SystemSetting::getSettingValue)
                .orElse("12:00"); // Default 12:00 PM
    }

    @Transactional
    public void saveGmailCredentials(String email, String password) {
        saveSetting(GMAIL_EMAIL_KEY, email, "System Gmail Email");
        saveSetting(GMAIL_PASSWORD_KEY, encrypt(password), "Encrypted Gmail App Password");
    }

    @Transactional
    public void saveWhatsAppCredentials(String phone, String apiKey) {
        saveSetting(ADMIN_WHATSAPP_PHONE_KEY, phone, "Admin WhatsApp Phone Number");
        saveSetting(WHATSAPP_API_KEY_KEY, apiKey, "WhatsApp API Key (e.g. CallMeBot)");
    }

    @Transactional
    public void saveAutomationSettings(boolean emailReminder, boolean whatsappReminder, String reminderTime,
            String processingTime) {
        saveSetting(EMAIL_REMINDER_ENABLED_KEY, String.valueOf(emailReminder), "Enable Email Reminders");
        saveSetting(WHATSAPP_REMINDER_ENABLED_KEY, String.valueOf(whatsappReminder), "Enable WhatsApp Reminders");
        saveSetting(SCHEDULER_REMINDER_TIME_KEY, reminderTime, "Time to send reminders (HH:mm)");
        saveSetting(SCHEDULER_PROCESSING_TIME_KEY, processingTime, "Time to process attendance (HH:mm)");
    }

    private void saveSetting(String key, String value, String description) {
        SystemSetting setting = repository.findBySettingKey(key)
                .orElse(SystemSetting.builder().settingKey(key).build());
        setting.setSettingValue(value);
        setting.setDescription(description);
        repository.save(setting);
    }

    // Simple obfuscation/encryption for the app password
    private String encrypt(String value) {
        if (value == null)
            return null;
        return Base64.getEncoder().encodeToString(value.getBytes());
    }

    private String decrypt(String value) {
        if (value == null)
            return null;
        return new String(Base64.getDecoder().decode(value));
    }
}
