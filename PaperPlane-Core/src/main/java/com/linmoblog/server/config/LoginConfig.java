package com.linmoblog.server.config;

import com.linmoblog.server.interceptor.AuthInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class LoginConfig implements WebMvcConfigurer {
    private static final String PROTECTED_API_PATTERN = "/api/protected/**";
    private static final String LOGIN_API_PATTERN = "/api/login";
    private static final String UPLOADS_RESOURCE_PATTERN = "/uploads/**";

    private final AuthInterceptor authInterceptor;
    private final String uploadDir;

    public LoginConfig(AuthInterceptor authInterceptor, @Value("${local.uploadDir:upload-dir}") String uploadDir) {
        this.authInterceptor = authInterceptor;
        this.uploadDir = uploadDir;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns(PROTECTED_API_PATTERN)
                .excludePathPatterns(LOGIN_API_PATTERN, UPLOADS_RESOURCE_PATTERN);
    }

    /**
     * 图片虚拟地址映射
     * @param registry
     * 设置该映射之后，外网只能访问本地的upload文件内部的资源
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler(UPLOADS_RESOURCE_PATTERN)
                .addResourceLocations(uploadResourceLocation());
    }

    private String uploadResourceLocation() {
        String uploadLocation = Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
        if (!uploadLocation.endsWith("/")) {
            uploadLocation += "/";
        }
        return uploadLocation;
    }
}
