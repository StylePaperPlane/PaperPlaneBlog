package com.linmoblog.server.interceptor;

import com.linmoblog.server.utils.JWTTokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(AuthInterceptor.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String ACCESS_FORBIDDEN_MESSAGE = "Access Forbidden";

    private final JWTTokenUtil jwtTokenUtil;

    public AuthInterceptor(JWTTokenUtil jwtTokenUtil) {
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String token = request.getHeader(AUTHORIZATION_HEADER);
        logger.debug("Protected request authorization header present: {}", token != null);
        if (token == null || !jwtTokenUtil.validateToken(token)) {
            reject(response);
            return false;
        }
        return true;
    }

    private void reject(HttpServletResponse response) throws Exception {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.getWriter().write(ACCESS_FORBIDDEN_MESSAGE);
    }
}
