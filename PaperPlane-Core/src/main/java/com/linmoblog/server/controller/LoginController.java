package com.linmoblog.server.controller;

import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.UserInfo;
import com.linmoblog.server.dto.LoginRequest;
import com.linmoblog.server.service.LoginService;
import com.linmoblog.server.aspect.ApiOperationLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@Tag(name = "登录接口")
public class LoginController {
    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @ApiOperationLog(description = "管理员登录")
    @Operation(summary = "管理员登录")
    @PostMapping("/api/login")
    public ResponseEntity<Result<String>> login(
            @RequestBody LoginRequest request,
            @RequestHeader(value = "CF-Connecting-IP", required = false) String cloudflareIp,
            HttpServletRequest servletRequest
    ) {
        String remoteIp = cloudflareIp == null || cloudflareIp.isBlank()
                ? servletRequest.getRemoteAddr()
                : cloudflareIp;
        return loginService.login(request, remoteIp);
    }

    @ApiOperationLog(description = "获取博主信息")
    @Operation(summary = "获取博主信息")
    @GetMapping("/api/public/user")
    public Result<UserInfo> userinfo() {
        return loginService.userinfo();
    }
}
