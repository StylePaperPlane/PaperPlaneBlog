package com.paperplane.blog.Controller;

import com.paperplane.blog.Entity.Result;
import com.paperplane.blog.Entity.User;
import com.paperplane.blog.Entity.UserInfo;
import com.paperplane.blog.Service.LoginService;
import com.paperplane.blog.aspect.ApiOperationLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "登录接口")
public class LoginController {
    @Autowired
    private LoginService loginService;

    @ApiOperationLog(description = "管理员登录")
    @Operation(summary = "管理员登录")
    @PostMapping("/api/login")
    public ResponseEntity<Result<String>> login(@RequestBody User user) {
        return loginService.login(user);
    }

    @ApiOperationLog(description = "获取博主信息")
    @Operation(summary = "获取博主信息")
    @GetMapping("/api/public/user")
    public Result<UserInfo> userinfo() {
        return loginService.userinfo();
    }
}
