package com.paperplane.blog.Entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MusicTrack {
    private Integer musicKey;
    private String title;
    private String artist;
    private String audioUrl;
    private String coverUrl;
    private String lyricUrl;
    private Integer sortOrder;
    private Boolean enabled;
    private Date createTime;
    private Date updateTime;
}
