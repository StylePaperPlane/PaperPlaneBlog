package com.linmoblog.server.service;

import com.linmoblog.server.dao.WebInfoDao;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.Social;
import com.linmoblog.server.entity.User;
import com.linmoblog.server.entity.WebInfo;
import com.linmoblog.server.utils.EncryptUtil;
import org.springframework.stereotype.Service;

@Service
public class WebInfoService {
    private static final String MASKED_PASSWORD = "";

    private final WebInfoDao webInfoDao;

    public WebInfoService(WebInfoDao webInfoDao) {
        this.webInfoDao = webInfoDao;
    }

    public Result<Void> updateWebInfo(WebInfo webInfo) {
        webInfoDao.updateWebInfo(webInfo, loginUserFrom(webInfo));
        return Result.success();
    }

    public Result<WebInfo> getWebInfo() {
        WebInfo webInfo = webInfoDao.getWebInfo();
        maskSensitiveFields(webInfo);
        return Result.success(webInfo);
    }

    public Result<Social> getSocial() {
        return Result.success(webInfoDao.getSocial());
    }

    private User loginUserFrom(WebInfo webInfo) {
        if (!hasLoginCredentials(webInfo)) {
            return null;
        }
        User user = new User();
        user.setUsername(EncryptUtil.encryptUsername(webInfo.getUserAccount()));
        user.setPassword(EncryptUtil.hashPassword(webInfo.getUserPassword()));
        return user;
    }

    private boolean hasLoginCredentials(WebInfo webInfo) {
        return hasText(webInfo.getUserAccount()) && hasText(webInfo.getUserPassword());
    }

    private void maskSensitiveFields(WebInfo webInfo) {
        webInfo.setUserPassword(MASKED_PASSWORD);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
