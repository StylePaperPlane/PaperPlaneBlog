package com.linmoblog.server.dao;

import com.linmoblog.server.entity.Social;
import com.linmoblog.server.entity.User;
import com.linmoblog.server.entity.WebInfo;
import com.linmoblog.server.mapper.WebInfoMapper;
import org.springframework.stereotype.Repository;

@Repository
public class WebInfoDao {
    private final WebInfoMapper webInfoMapper;

    public WebInfoDao(WebInfoMapper webInfoMapper) {
        this.webInfoMapper = webInfoMapper;
    }

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
