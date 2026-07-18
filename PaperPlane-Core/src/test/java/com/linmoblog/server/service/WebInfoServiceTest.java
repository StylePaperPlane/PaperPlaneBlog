package com.linmoblog.server.service;

import com.linmoblog.server.dao.WebInfoDao;
import com.linmoblog.server.entity.Social;
import com.linmoblog.server.entity.WebInfo;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WebInfoServiceTest {
    @Test
    void storesBlankSocialLinksAsNullAndTrimsConfiguredLinks() {
        WebInfoDao dao = mock(WebInfoDao.class);
        WebInfoService service = new WebInfoService(dao);
        WebInfo webInfo = new WebInfo();
        webInfo.setSocialGithub("  https://github.com/paperplane  ");
        webInfo.setSocialEmail("   ");

        service.updateWebInfo(webInfo);

        ArgumentCaptor<WebInfo> captor = ArgumentCaptor.forClass(WebInfo.class);
        verify(dao).updateWebInfo(captor.capture(), isNull());
        assertThat(captor.getValue().getSocialGithub()).isEqualTo("https://github.com/paperplane");
        assertThat(captor.getValue().getSocialEmail()).isNull();
    }

    @Test
    void normalizesLegacyWhitespaceWhenReadingSocialLinks() {
        WebInfoDao dao = mock(WebInfoDao.class);
        Social stored = new Social("  https://github.com/paperplane  ", " ", null, null, null);
        when(dao.getSocial()).thenReturn(stored);
        WebInfoService service = new WebInfoService(dao);

        Social result = service.getSocial().getData();

        assertThat(result.getSocialGithub()).isEqualTo("https://github.com/paperplane");
        assertThat(result.getSocialEmail()).isNull();
    }
}
