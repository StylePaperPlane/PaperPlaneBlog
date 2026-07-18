package com.linmoblog.server.service;

import com.linmoblog.server.dao.WebInfoDao;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.Social;
import com.linmoblog.server.entity.User;
import com.linmoblog.server.entity.WebInfo;
import com.linmoblog.server.utils.EncryptUtil;
import com.linmoblog.server.utils.PublicResourceUrl;
import org.springframework.stereotype.Service;

@Service
public class WebInfoService {
    private static final String MASKED_PASSWORD = "";

    private final WebInfoDao webInfoDao;

    public WebInfoService(WebInfoDao webInfoDao) {
        this.webInfoDao = webInfoDao;
    }

    public Result<Void> updateWebInfo(WebInfo webInfo) {
        normalizeSocialLinks(webInfo);
        webInfoDao.updateWebInfo(webInfo, loginUserFrom(webInfo));
        return Result.success();
    }

    public Result<WebInfo> getWebInfo() {
        WebInfo webInfo = webInfoDao.getWebInfo();
        webInfo.setUserAvatar(PublicResourceUrl.normalize(webInfo.getUserAvatar()));
        maskSensitiveFields(webInfo);
        return Result.success(webInfo);
    }

    public Result<Social> getSocial() {
        Social social = webInfoDao.getSocial();
        if (social != null) {
            social.setSocialGithub(normalizeOptionalValue(social.getSocialGithub()));
            social.setSocialEmail(normalizeOptionalValue(social.getSocialEmail()));
            social.setSocialBilibili(normalizeOptionalValue(social.getSocialBilibili()));
            social.setSocialQQ(normalizeOptionalValue(social.getSocialQQ()));
            social.setSocialNeteaseCloud(normalizeOptionalValue(social.getSocialNeteaseCloud()));
        }
        return Result.success(social);
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

    private void normalizeSocialLinks(WebInfo webInfo) {
        webInfo.setSocialGithub(normalizeOptionalValue(webInfo.getSocialGithub()));
        webInfo.setSocialEmail(normalizeOptionalValue(webInfo.getSocialEmail()));
        webInfo.setSocialBilibili(normalizeOptionalValue(webInfo.getSocialBilibili()));
        webInfo.setSocialQQ(normalizeOptionalValue(webInfo.getSocialQQ()));
        webInfo.setSocialNeteaseCloud(normalizeOptionalValue(webInfo.getSocialNeteaseCloud()));
    }

    private String normalizeOptionalValue(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
