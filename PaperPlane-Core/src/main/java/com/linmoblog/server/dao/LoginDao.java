package com.linmoblog.server.dao;

import com.linmoblog.server.entity.User;
import com.linmoblog.server.entity.UserInfo;
import com.linmoblog.server.mapper.LoginMapper;
import org.springframework.stereotype.Repository;

@Repository
public class LoginDao {
    private final LoginMapper loginMapper;

    public LoginDao(LoginMapper loginMapper) {
        this.loginMapper = loginMapper;
    }

    public User findByUsername(String username) {
        return loginMapper.findByUsername(username);
    }

    public UserInfo userinfo() {
        return loginMapper.userinfo();
    }
}
