package com.paperplane.blog.Config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
public class Knife4jConfig {
    @Bean
    public OpenAPI springShopOpenAPI() {
        return new OpenAPI()
                // 接口文档标题
                .info(new Info().title("PaperPlane Blog接口文档")
                        // 接口文档简介
                        .description("PaperPlane Blog API documentation.")
                        // 接口文档版本
                        .version("1.0版本")
                        // Contact information
                        .contact(new Contact().name("PaperPlane Blog Contributors")
                                .email("example@example.com")))
                .externalDocs(new ExternalDocumentation()
                        .description("后台接口文档")
                        .url("https://example.com"));
    }
}
