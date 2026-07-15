package com.linmoblog.server.controller;

import com.linmoblog.server.utils.JWTTokenUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/api/internal/auth")
public class InternalAuthController {
    private final JWTTokenUtil jwtTokenUtil;
    private final byte[] serviceToken;

    public InternalAuthController(
            JWTTokenUtil jwtTokenUtil,
            @Value("${paperplane.internal.service-token:}") String serviceToken
    ) {
        this.jwtTokenUtil = jwtTokenUtil;
        this.serviceToken = serviceToken.getBytes(StandardCharsets.UTF_8);
    }

    @PostMapping("/introspect")
    public ResponseEntity<Void> introspect(
            @RequestHeader(value = "X-PaperPlane-Service-Token", required = false) String presentedServiceToken,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        if (!validServiceToken(presentedServiceToken) || authorization == null || authorization.isBlank()) {
            return ResponseEntity.status(401).build();
        }
        String jwt = authorization.startsWith("Bearer ") ? authorization.substring(7) : authorization;
        return jwtTokenUtil.validateToken(jwt)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.status(401).build();
    }

    private boolean validServiceToken(String presented) {
        if (serviceToken.length == 0 || presented == null) {
            return false;
        }
        return MessageDigest.isEqual(serviceToken, presented.getBytes(StandardCharsets.UTF_8));
    }
}
