package com.paperplane.blog.Utils;

import com.paperplane.blog.Entity.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class EncryptUtil {
    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder(12);

    public static void encrypt(User user) {
        user.setUsername(encryptUsername(user.getUsername()));
        user.setPassword(hashPassword(user.getPassword()));
    }

    public static String encryptUsername(String username) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return encryptString(username, digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    public static String hashPassword(String rawPassword) {
        return PASSWORD_ENCODER.encode(rawPassword);
    }

    public static boolean matchesPassword(String rawPassword, String encodedPassword) {
        return rawPassword != null && encodedPassword != null && PASSWORD_ENCODER.matches(rawPassword, encodedPassword);
    }

    private static String encryptString(String input, MessageDigest digest) {
        byte[] hash = digest.digest(input.getBytes());
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }

        return hexString.toString();
    }
}
