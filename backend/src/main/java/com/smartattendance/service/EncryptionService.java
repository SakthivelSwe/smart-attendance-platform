package com.smartattendance.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM encryption service for encrypting sensitive data at rest.
 *
 * Used to encrypt phone numbers in ContactMapEntry so that even if the
 * database is compromised, raw personal phone numbers cannot be read.
 *
 * Configuration:
 * Set APP_ENCRYPTION_KEY environment variable to a 32-byte Base64-encoded key.
 * Generate one with: openssl rand -base64 32
 * If not set, a random key is generated per server start (data won't survive
 * restarts).
 */
@Service
public class EncryptionService {

    private static final Logger logger = LoggerFactory.getLogger(EncryptionService.class);
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 96 bits
    private static final int GCM_TAG_LENGTH = 128; // bits

    private final SecretKey secretKey;

    public EncryptionService(@Value("${app.encryption.key:}") String base64Key) {
        if (base64Key != null && !base64Key.isBlank()) {
            try {
                byte[] keyBytes = Base64.getDecoder().decode(base64Key);
                this.secretKey = new SecretKeySpec(keyBytes, "AES");
                logger.info("EncryptionService initialized with configured key (AES-{}-GCM).", keyBytes.length * 8);
            } catch (Exception e) {
                throw new IllegalStateException("Invalid APP_ENCRYPTION_KEY: must be Base64-encoded 32 bytes. " +
                        "Generate with: openssl rand -base64 32", e);
            }
        } else {
            // Fallback: generate a random key (data won't survive restarts - OK for dev)
            try {
                KeyGenerator keyGen = KeyGenerator.getInstance("AES");
                keyGen.init(256, new SecureRandom());
                this.secretKey = keyGen.generateKey();
                logger.warn("APP_ENCRYPTION_KEY not set. Using a random AES-256 key. " +
                        "Set APP_ENCRYPTION_KEY env var in production!");
            } catch (Exception e) {
                throw new IllegalStateException("Failed to generate encryption key", e);
            }
        }
    }

    /**
     * Encrypt a plain text string.
     * Returns prefixed Base64: ENC:[12-byte IV][ciphertext+auth-tag]
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isBlank())
            return plaintext;
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes());

            // Prepend IV to ciphertext
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);

            return "ENC:" + Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Decrypt a previously encrypted string.
     * Input must start with "ENC:" prefix.
     */
    public String decrypt(String encrypted) {
        if (encrypted == null || !encrypted.startsWith("ENC:"))
            return encrypted;
        try {
            byte[] combined = Base64.getDecoder().decode(encrypted.substring(4));

            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] ciphertext = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, iv.length);
            System.arraycopy(combined, iv.length, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(ciphertext));
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed. Possible key mismatch.", e);
        }
    }

    /**
     * Returns true if the value is already encrypted (has ENC: prefix).
     */
    public boolean isEncrypted(String value) {
        return value != null && value.startsWith("ENC:");
    }
}
