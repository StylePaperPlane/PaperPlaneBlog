package com.linmoblog.server.utils;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import io.jsonwebtoken.security.WeakKeyException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Component
public class JWTTokenUtil {

    private final SecretKey secretKey;
    private final long expire;

    public JWTTokenUtil(@Value("${jwt.key}") String key, @Value("${jwt.expire}") long expire) {
        this.secretKey = createSecretKey(key);
        this.expire = expire;
    }

    /**
     * 生成带过期时间的 JWT 令牌。
     */
    public String createToken(String username) {
        return generateToken(username, expire);
    }

    /**
     * @param body       内容
     * @param expireTime 过期时间
     * @return JWT 字符串
     */
    private String generateToken(String body, long expireTime) {
        return Jwts.builder()
                .setSubject(body)
                .setExpiration(new Date(System.currentTimeMillis() + expireTime))
                .signWith(secretKey)
                .compact();
    }

    /**
     * 验证 JWT 令牌是否可解析且未过期。
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (WeakKeyException | ExpiredJwtException | UnsupportedJwtException | MalformedJwtException |
                 SignatureException | IllegalArgumentException e) {
            return false;
        }
    }

    private SecretKey createSecretKey(String key) {
        byte[] base64 = Base64.getEncoder().encode(key.getBytes());
        return Keys.hmacShaKeyFor(base64);
    }
}
