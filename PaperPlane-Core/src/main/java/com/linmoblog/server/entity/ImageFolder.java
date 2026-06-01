package com.linmoblog.server.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImageFolder {
    private int folderKey;
    private String folderName;
    private int imageCount;
}
