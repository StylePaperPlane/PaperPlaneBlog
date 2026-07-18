package com.linmoblog.server.service;

import com.linmoblog.server.dao.LoginDao;
import com.linmoblog.server.entity.UserInfo;
import com.linmoblog.server.security.login.TurnstileVerifier;
import com.linmoblog.server.utils.JWTTokenUtil;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LoginServiceTest {
    @Test
    void returnsAnAvatarUrlThatIsIndependentOfTheCurrentBrowserRoute() {
        LoginDao loginDao = mock(LoginDao.class);
        UserInfo stored = new UserInfo("uploads/avatar.jpg", "PaperPlane", "PaperPlane");
        when(loginDao.userinfo()).thenReturn(stored);
        LoginService service = new LoginService(
                loginDao,
                mock(JWTTokenUtil.class),
                mock(TurnstileVerifier.class)
        );

        UserInfo response = service.userinfo().getData();

        assertThat(response.getUserAvatar()).isEqualTo("/uploads/avatar.jpg");
    }
}
