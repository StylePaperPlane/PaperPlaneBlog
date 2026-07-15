package com.linmoblog.server.security.login;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.http.client.JdkClientHttpRequestFactory;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;

@Service
public class TurnstileVerifier {
    private static final Logger logger = LoggerFactory.getLogger(TurnstileVerifier.class);

    private final RestClient restClient;
    private final String secret;
    private final String expectedHostname;
    private final String expectedAction;

    @Autowired
    public TurnstileVerifier(
            RestClient.Builder restClientBuilder,
            @Value("${login.turnstile.verify-url}") String verifyUrl,
            @Value("${login.turnstile.secret}") String secret,
            @Value("${login.turnstile.hostname}") String expectedHostname,
            @Value("${login.turnstile.action}") String expectedAction
    ) {
        this(
                restClientBuilder.requestFactory(requestFactory()).baseUrl(verifyUrl).build(),
                secret,
                expectedHostname,
                expectedAction
        );
    }

    TurnstileVerifier(
            RestClient restClient,
            String secret,
            String expectedHostname,
            String expectedAction
    ) {
        this.restClient = restClient;
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("LOGIN_TURNSTILE_SECRET must be configured");
        }
        this.secret = secret;
        this.expectedHostname = expectedHostname;
        this.expectedAction = expectedAction;
    }

    private static JdkClientHttpRequestFactory requestFactory() {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(5));
        return factory;
    }

    public void verify(String token, String remoteIp) {
        if (token == null || token.isBlank() || token.length() > 2048) {
            throw LoginChallengeException.rejected();
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", secret);
        form.add("response", token);
        if (remoteIp != null && !remoteIp.isBlank()) {
            form.add("remoteip", remoteIp);
        }

        SiteverifyResponse result;
        try {
            result = restClient.post()
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(SiteverifyResponse.class);
        } catch (RestClientException exception) {
            logger.error("Turnstile Siteverify request failed", exception);
            throw LoginChallengeException.unavailable();
        }

        if (result == null
                || !result.success()
                || !expectedHostname.equals(result.hostname())
                || !expectedAction.equals(result.action())) {
            logger.warn(
                    "Turnstile login verification rejected: hostname={}, action={}, errors={}",
                    result == null ? null : result.hostname(),
                    result == null ? null : result.action(),
                    result == null ? List.of() : result.errorCodes()
            );
            throw LoginChallengeException.rejected();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record SiteverifyResponse(
            boolean success,
            String hostname,
            String action,
            @JsonProperty("error-codes") List<String> errorCodes
    ) {
    }
}
