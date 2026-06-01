package com.linmoblog.server.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class TagLevelOne {
    private int tagKey;
    private String title;
    private int level;
    private String color;
}
