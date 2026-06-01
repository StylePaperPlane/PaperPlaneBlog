package com.linmoblog.server.utils;

import com.linmoblog.server.entity.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class EncryptUtil {
    private static final int BCRYPT_STRENGTH = 12;
    private static final String USERNAME_DIGEST_ALGORITHM = "SHA-256";
    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder(BCRYPT_STRENGTH);

    private EncryptUtil() {
    }

    public static void encrypt(User user) {
        user.setUsername(encryptUsername(user.getUsername()));
        user.setPassword(hashPassword(user.getPassword()));
    }

    public static String encryptUsername(String username) {
        try {
            MessageDigest digest = MessageDigest.getInstance(USERNAME_DIGEST_ALGORITHM);
            return encryptString(username, digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(USERNAME_DIGEST_ALGORITHM + " is not available", e);
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
            appendHexByte(hexString, b);
        }

        return hexString.toString();
    }

    private static void appendHexByte(StringBuilder hexString, byte value) {
        String hex = Integer.toHexString(0xff & value);
        if (hex.length() == 1) {
            hexString.append('0');
        }
        hexString.append(hex);
    }
}
