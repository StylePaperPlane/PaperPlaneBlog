package com.linmoblog.server.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Social {
    private String socialGithub;
    private String socialEmail;
    private String socialBilibili;
    private String socialQQ;
    private String socialNeteaseCloud;
}
