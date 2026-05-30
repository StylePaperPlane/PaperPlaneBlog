package com.paperplane.blog.Service;

import com.paperplane.blog.Dao.LoginDao;
import com.paperplane.blog.Entity.Result;
import com.paperplane.blog.Entity.User;
import com.paperplane.blog.Entity.UserInfo;
import com.paperplane.blog.Utils.EncryptUtil;
import com.paperplane.blog.Utils.JWTTokenUtil;
import com.paperplane.blog.enums.ResultCode;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class LoginService {
    @Autowired
    private LoginDao loginDao;
    @Resource
    private JWTTokenUtil jwtTokenUtil;
    public ResponseEntity<Result<String>> login(User user) {
        String usernameHash = EncryptUtil.encryptUsername(user.getUsername());
        User res = loginDao.findByUsername(usernameHash);
        if(res != null && EncryptUtil.matchesPassword(user.getPassword(), res.getPassword())) {
            String token = jwtTokenUtil.CreateToken("admin");
            Result<String> result = new Result<>(ResultCode.SUCCESS_LOGIN, token);
            return ResponseEntity.status(HttpStatus.OK).body(result);
        }
        Result<String> result =  new Result<>(ResultCode.ERROR_LOGIN,null);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(result);
    }

    public Result<UserInfo> userinfo() {
        return loginDao.userinfo();
    }
}
