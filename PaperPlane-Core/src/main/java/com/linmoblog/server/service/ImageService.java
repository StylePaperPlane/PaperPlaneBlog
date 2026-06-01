package com.linmoblog.server.service;

import com.linmoblog.server.dao.ImageDao;
import com.linmoblog.server.entity.Image;
import com.linmoblog.server.entity.ImageFolder;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.enums.ResultCode;
import com.linmoblog.server.exception.CommonException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class ImageService {
    public static final String DEFAULT_FOLDER = "默认文件夹";

    private final ImageDao imageDao;
    private final FileResourceService resourceService;
    private final Path uploadRoot;

    public ImageService(
            ImageDao imageDao,
            FileResourceService resourceService,
            @Value("${local.uploadDir}") String uploadDir
    ) {
        this.imageDao = imageDao;
        this.resourceService = resourceService;
        this.uploadRoot = Paths.get(uploadDir);
    }

    @Transactional
    public Result<String> upload(MultipartFile file, String folderName) {
        String normalizedFolderName = normalizeFolderName(folderName);
        imageDao.createFolder(normalizedFolderName);
        String fileUrl = resourceService.upload(file);
        imageDao.upload(fileUrl, normalizedFolderName);
        return Result.success(fileUrl);
    }

    @Transactional
    public Result<Void> deleteImages(List<String> imageUrlList) {
        resourceService.delete(imageUrlList);
        imageDao.delete(imageUrlList);
        return Result.success();
    }

    public Result<List<Image>> getImages(String folderName) {
        return Result.success(imageDao.getImages(normalizeFolderName(folderName)));
    }

    @Transactional
    public Result<Void> createFolder(String folderName) {
        imageDao.createFolder(normalizeFolderName(folderName));
        return Result.success();
    }

    public Result<List<ImageFolder>> getFolders() {
        return Result.success(imageDao.getFolders());
    }

    @Transactional
    public Result<Void> moveImages(List<String> imageUrlList, String folderName) {
        if (imageUrlList == null || imageUrlList.isEmpty()) {
            throw new CommonException(ResultCode.FAILED.getCode(), "请选择要移动的图片");
        }

        String normalizedFolderName = normalizeFolderName(folderName);
        imageDao.createFolder(normalizedFolderName);
        imageDao.moveImages(imageUrlList, normalizedFolderName);
        return Result.success();
    }

    public FileSystemResource getDownloadResource(String filename) {
        return new FileSystemResource(uploadRoot.resolve(filename).toFile());
    }

    private String normalizeFolderName(String folderName) {
        if (folderName == null || folderName.trim().isEmpty()) {
            return DEFAULT_FOLDER;
        }

        String normalizedFolderName = folderName.trim();
        if (normalizedFolderName.length() > 50) {
            throw new CommonException(ResultCode.FAILED.getCode(), "文件夹名称不能超过50个字符");
        }

        return normalizedFolderName;
    }
}
