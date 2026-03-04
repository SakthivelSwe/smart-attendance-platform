package com.smartattendance.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM encryption service for sensitive data like Gmail App Passwords.
 * Uses a configurable secret key from application properties.
 */
@Service
public class EncryptionService {

    private static final Logger logger = LoggerFactory.getLogger(EncryptionService.class);

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    @Value("${app.encryption.key:SmartAttendanceDefaultKey12345678}")
    private String encryptionKey;

    /**
     * Encrypt plaintext using AES-256-GCM.
     * Returns Base64-encoded string containing IV + ciphertext.
     */
    public String encrypt(String plainText) {
        if (plainText == null)
            return null;

        try {
            byte[] keyBytes = normalizeKey(encryptionKey);
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");

            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);

            byte[] cipherText = cipher.doFinal(plainText.getBytes());

            // Prepend IV to ciphertext
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            logger.error("Encryption failed: {}", e.getMessage());
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Decrypt AES-256-GCM encrypted string.
     * Input is Base64-encoded string containing IV + ciphertext.
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null)
            return null;

        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedText);
            byte[] keyBytes = normalizeKey(encryptionKey);
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");

            // Extract IV from beginning
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);
            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);

            byte[] plainText = cipher.doFinal(cipherText);
            return new String(plainText);
        } catch (Exception e) {
            // Decryption failed — the stored value is corrupted or was encrypted with a
            // different key. Return null so callers can prompt re-entry of credentials.
            logger.error("AES-GCM decryption failed — stored credentials may be corrupted. " +
                    "User must re-save Gmail credentials. Error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Normalize key to exactly 32 bytes (256 bits) for AES-256.
     */
    private byte[] normalizeKey(String key) {
        byte[] keyBytes = new byte[32];
        byte[] rawBytes = key.getBytes();
        System.arraycopy(rawBytes, 0, keyBytes, 0, Math.min(rawBytes.length, 32));
        return keyBytes;
    }
}
