package com.linmoblog.server.utils;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PublicResourceUrlTest {
    @Test
    void anchorsManagedUploadsAtTheSiteRoot() {
        assertThat(PublicResourceUrl.normalize("uploads/avatar.jpg")).isEqualTo("/uploads/avatar.jpg");
        assertThat(PublicResourceUrl.normalize("/uploads/avatar.jpg")).isEqualTo("/uploads/avatar.jpg");
    }

    @Test
    void preservesExternalAndEmptyReferences() {
        assertThat(PublicResourceUrl.normalize("https://cdn.example/avatar.jpg"))
                .isEqualTo("https://cdn.example/avatar.jpg");
        assertThat(PublicResourceUrl.normalize("data:image/png;base64,AA=="))
                .isEqualTo("data:image/png;base64,AA==");
        assertThat(PublicResourceUrl.normalize(null)).isNull();
        assertThat(PublicResourceUrl.normalize("")).isEmpty();
    }
}
