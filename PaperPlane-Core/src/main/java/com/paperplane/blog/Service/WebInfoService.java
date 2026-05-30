package com.paperplane.blog.Service;

import com.paperplane.blog.Dao.WebInfoDao;
import com.paperplane.blog.Entity.Result;
import com.paperplane.blog.Entity.Social;
import com.paperplane.blog.Entity.User;
import com.paperplane.blog.Entity.WebInfo;
import com.paperplane.blog.Utils.EncryptUtil;
import com.paperplane.blog.enums.ResultCode;
import org.apache.ibatis.jdbc.Null;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class WebInfoService {
    @Autowired
    private WebInfoDao webInfoDao;

    public Result<Null> updateWebInfo(WebInfo webInfo) {
        User user = null;
        if (hasText(webInfo.getUserAccount()) && hasText(webInfo.getUserPassword())) {
            user = new User();
            user.setUsername(EncryptUtil.encryptUsername(webInfo.getUserAccount()));
            user.setPassword(EncryptUtil.hashPassword(webInfo.getUserPassword()));
        }
        webInfoDao.updateWebInfo(webInfo,user);
        return new Result<>(ResultCode.SUCCESS,null);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    public Result<WebInfo> getWebInfo() {
        WebInfo webInfo = webInfoDao.getWebInfo();
        webInfo.setUserAccount(webInfo.getUserAccount());
        webInfo.setUserPassword("");
        return new Result<>(ResultCode.SUCCESS,webInfo);
    }

    public Result<Social> getSocial() {
        Social social = webInfoDao.getSocial();
        return new Result<>(ResultCode.SUCCESS,social);
    }
}
