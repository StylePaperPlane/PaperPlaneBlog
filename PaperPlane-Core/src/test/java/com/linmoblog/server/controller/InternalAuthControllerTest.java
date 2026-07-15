package com.linmoblog.server.controller;

import com.linmoblog.server.utils.JWTTokenUtil;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InternalAuthControllerTest {
    private final JWTTokenUtil jwt = new JWTTokenUtil("a-long-test-secret-that-is-longer-than-thirty-two-bytes", 60_000);
    private final InternalAuthController controller = new InternalAuthController(jwt, "internal-test-token");

    @Test
    void acceptsOnlyAValidServiceTokenAndAdminJwt() {
        String token = jwt.createToken("admin");
        assertThat(controller.introspect("internal-test-token", token).getStatusCode().value()).isEqualTo(204);
        assertThat(controller.introspect("wrong", token).getStatusCode().value()).isEqualTo(401);
        assertThat(controller.introspect("internal-test-token", "not-a-jwt").getStatusCode().value()).isEqualTo(401);
    }
}
