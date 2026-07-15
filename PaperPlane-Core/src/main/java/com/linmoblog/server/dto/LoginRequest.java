package com.linmoblog.server.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = false)
public record LoginRequest(String username, String password, String turnstileToken) {
}
