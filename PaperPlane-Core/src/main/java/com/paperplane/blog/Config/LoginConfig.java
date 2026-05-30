package com.paperplane.blog.Config;

import com.paperplane.blog.Interceptor.Interceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class LoginConfig implements WebMvcConfigurer {
    @Autowired
    private Interceptor interceptor;

    @Value("${local.uploadDir:upload-dir}")
    private String uploadDir;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor).addPathPatterns("/api/protected/**")
                .excludePathPatterns("/api/login", "/uploads/**");  // 除了login接口以及静态图片路径
    }

    /**
     * 图片虚拟地址映射
     * @param registry
     * 设置该映射之后，外网只能访问本地的upload文件内部的资源
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadLocation = Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
        if (!uploadLocation.endsWith("/")) {
            uploadLocation += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadLocation);
    }
}
