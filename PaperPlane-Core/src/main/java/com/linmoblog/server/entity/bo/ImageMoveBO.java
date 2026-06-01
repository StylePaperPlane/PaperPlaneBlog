package com.linmoblog.server.entity.bo;

import lombok.Data;

import java.util.List;

@Data
public class ImageMoveBO {
    private List<String> imageUrls;
    private String folderName;
}
