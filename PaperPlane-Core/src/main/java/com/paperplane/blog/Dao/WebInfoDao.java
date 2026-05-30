package com.paperplane.blog.Dao;

import com.paperplane.blog.Entity.Social;
import com.paperplane.blog.Entity.User;
import com.paperplane.blog.Entity.WebInfo;
import com.paperplane.blog.Mapper.WebInfoMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class WebInfoDao {
    @Autowired
    private WebInfoMapper webInfoMapper;

    public void updateWebInfo(WebInfo webInfo, User user) {
        webInfoMapper.updateWebInfo(webInfo);
        if (user != null) {
            webInfoMapper.updateLogin(user);
        }
    }

    public WebInfo getWebInfo() {
        return webInfoMapper.getWebInfo();
    }

    public Social getSocial() {
        return webInfoMapper.getSocial();
    }
}
