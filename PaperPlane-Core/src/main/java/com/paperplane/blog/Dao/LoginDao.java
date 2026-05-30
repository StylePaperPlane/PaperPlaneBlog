package com.paperplane.blog.Dao;

import com.paperplane.blog.Entity.Result;
import com.paperplane.blog.Entity.User;
import com.paperplane.blog.Entity.UserInfo;
import com.paperplane.blog.Mapper.LoginMapper;
import com.paperplane.blog.enums.ResultCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class LoginDao {
    @Autowired
    private LoginMapper loginMapper;

    public User findByUsername(String username){
        return loginMapper.findByUsername(username);
    }

    public Result<UserInfo> userinfo() {
        UserInfo res = loginMapper.userinfo();
        return new Result<UserInfo>(ResultCode.SUCCESS,res);
    }
}
