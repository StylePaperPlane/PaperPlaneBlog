package com.linmoblog.server.service;

import com.linmoblog.server.dao.LoginDao;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.User;
import com.linmoblog.server.entity.UserInfo;
import com.linmoblog.server.enums.ResultCode;
import com.linmoblog.server.utils.EncryptUtil;
import com.linmoblog.server.utils.JWTTokenUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class LoginService {
    private final LoginDao loginDao;
    private final JWTTokenUtil jwtTokenUtil;

    public LoginService(LoginDao loginDao, JWTTokenUtil jwtTokenUtil) {
        this.loginDao = loginDao;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    public ResponseEntity<Result<String>> login(User user) {
        String usernameHash = EncryptUtil.encryptUsername(user.getUsername());
        User storedUser = loginDao.findByUsername(usernameHash);
        if (storedUser != null && EncryptUtil.matchesPassword(user.getPassword(), storedUser.getPassword())) {
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
