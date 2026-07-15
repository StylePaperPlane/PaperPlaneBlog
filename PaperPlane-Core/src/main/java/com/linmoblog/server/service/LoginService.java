package com.linmoblog.server.service;

import com.linmoblog.server.dao.LoginDao;
import com.linmoblog.server.dto.LoginRequest;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.User;
import com.linmoblog.server.entity.UserInfo;
import com.linmoblog.server.enums.ResultCode;
import com.linmoblog.server.utils.EncryptUtil;
import com.linmoblog.server.utils.JWTTokenUtil;
import com.linmoblog.server.security.login.TurnstileVerifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class LoginService {
    private final LoginDao loginDao;
    private final JWTTokenUtil jwtTokenUtil;
    private final TurnstileVerifier turnstileVerifier;

    public LoginService(LoginDao loginDao, JWTTokenUtil jwtTokenUtil, TurnstileVerifier turnstileVerifier) {
        this.loginDao = loginDao;
        this.jwtTokenUtil = jwtTokenUtil;
        this.turnstileVerifier = turnstileVerifier;
    }

    public ResponseEntity<Result<String>> login(LoginRequest request, String remoteIp) {
        turnstileVerifier.verify(request.turnstileToken(), remoteIp);
        String usernameHash = EncryptUtil.encryptUsername(request.username());
        User storedUser = loginDao.findByUsername(usernameHash);
        if (storedUser != null && EncryptUtil.matchesPassword(request.password(), storedUser.getPassword())) {
            String token = jwtTokenUtil.createToken("admin");
            return ResponseEntity.status(HttpStatus.OK)
                    .body(new Result<>(ResultCode.SUCCESS_LOGIN, token));
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new Result<>(ResultCode.ERROR_LOGIN, null));
    }

    public Result<UserInfo> userinfo() {
        return Result.success(loginDao.userinfo());
    }
}
