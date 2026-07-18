package com.linmoblog.server.security.login;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class TurnstileVerifierTest {
    @Test
    void acceptsOnlyTheConfiguredLoginActionAndHostname() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://turnstile.test/siteverify");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        TurnstileVerifier verifier = new TurnstileVerifier(
                builder.build(), "secret", "blog.paperplane.codes", "admin_login", false
        );
        server.expect(requestTo("https://turnstile.test/siteverify"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(content().string("secret=secret&response=token&remoteip=203.0.113.8"))
                .andRespond(withSuccess(
                        "{\"success\":true,\"hostname\":\"blog.paperplane.codes\",\"action\":\"admin_login\",\"error-codes\":[]}",
                        MediaType.APPLICATION_JSON
                ));

        verifier.verify("token", "203.0.113.8");
        server.verify();
    }

    @Test
    void rejectsAValidTokenIssuedForAnotherAction() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://turnstile.test/siteverify");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        TurnstileVerifier verifier = new TurnstileVerifier(
                builder.build(), "secret", "blog.paperplane.codes", "admin_login", false
        );
        server.expect(requestTo("https://turnstile.test/siteverify"))
                .andRespond(withSuccess(
                        "{\"success\":true,\"hostname\":\"blog.paperplane.codes\",\"action\":\"media_playback\",\"error-codes\":[]}",
                        MediaType.APPLICATION_JSON
                ));

        assertThatThrownBy(() -> verifier.verify("token", "203.0.113.8"))
                .isInstanceOf(LoginChallengeException.class)
                .hasMessageContaining("验证失败");
    }

    @Test
    void acceptsTheOfficialTestingTokenWithoutCallingSiteverify() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://turnstile.test/siteverify");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        TurnstileVerifier verifier = new TurnstileVerifier(
                builder.build(), "1x0000000000000000000000000000000AA", "localhost", "admin_login", true
        );

        verifier.verify("XXXX.DUMMY.TOKEN.XXXX", "127.0.0.1");
        server.verify();
    }

    @Test
    void testingModeRejectsResponsesWithoutTheTestingKeyMarker() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://turnstile.test/siteverify");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        TurnstileVerifier verifier = new TurnstileVerifier(
                builder.build(), "1x0000000000000000000000000000000AA", "localhost", "admin_login", true
        );

        assertThatThrownBy(() -> verifier.verify("token", "127.0.0.1"))
                .isInstanceOf(LoginChallengeException.class)
                .hasMessageContaining("验证失败");
        server.verify();
    }

    @Test
    void testingModeCannotBeEnabledWithAProductionSecret() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://turnstile.test/siteverify");

        assertThatThrownBy(() -> new TurnstileVerifier(
                builder.build(), "production-secret", "localhost", "admin_login", true
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("official Cloudflare test secret");
    }
}
