package com.linmoblog.server.security.login;

public class LoginChallengeException extends RuntimeException {
    private final boolean serviceUnavailable;

    private LoginChallengeException(String message, boolean serviceUnavailable) {
        super(message);
        this.serviceUnavailable = serviceUnavailable;
    }

    public static LoginChallengeException rejected() {
        return new LoginChallengeException("人机验证失败或已过期，请重试", false);
    }

    public static LoginChallengeException unavailable() {
        return new LoginChallengeException("人机验证服务暂时不可用，请稍后重试", true);
    }

    public boolean isServiceUnavailable() {
        return serviceUnavailable;
    }
}
