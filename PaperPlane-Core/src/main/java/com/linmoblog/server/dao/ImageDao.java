package com.linmoblog.server.dao;

import com.linmoblog.server.entity.Image;
import com.linmoblog.server.entity.ImageFolder;
import com.linmoblog.server.mapper.ImageMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ImageDao {
    private final ImageMapper imageMapper;

    public ImageDao(ImageMapper imageMapper) {
        this.imageMapper = imageMapper;
    }

    public void upload(String imageUrl, String folderName) {
        imageMapper.upload(imageUrl, folderName);
    }

    public void delete(List<String> imageUrlList) {
        imageMapper.delete(imageUrlList);
    }

    public List<Image> getImages(String folderName) {
        return imageMapper.getImages(folderName);
    }

    public void createFolder(String folderName) {
        imageMapper.createFolder(folderName);
    }

    public List<ImageFolder> getFolders() {
        return imageMapper.getFolders();
    }

    public void moveImages(List<String> imageUrlList, String folderName) {
        imageMapper.moveImages(imageUrlList, folderName);
    }
}
