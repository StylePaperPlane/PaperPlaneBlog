package com.linmoblog.server.service.impl;

import com.linmoblog.server.enums.ResultCode;
import com.linmoblog.server.exception.CommonException;
import com.linmoblog.server.service.FileResourceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * 使用本地存储，在配置文件中要添加 local.enable = true
 *
 * @author wkq97@qq.com
 * @since 2024-04-07
 */
@Service
@Slf4j
@ConditionalOnProperty(value = "local.enable", havingValue = "true")
public class LocalFileResourceService implements FileResourceService {

    private static final String PUBLIC_UPLOAD_PREFIX = "uploads/";
    private static final String HTTP_SCHEME = "http://";
    private static final String HTTPS_SCHEME = "https://";
    private static final String PATH_SEPARATOR = "/";

    private final Path uploadRoot;

    public LocalFileResourceService(@Value("${local.uploadDir}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @Override
    public void delete(List<String> files) {
        if (CollectionUtils.isEmpty(files)) {
            return;
        }

        for (String fileUrl : files) {
            if (fileUrl == null || fileUrl.isBlank()) {
                continue;
            }
            if (isRemoteFile(fileUrl)) {
                log.info("跳过远程图片文件删除，仅删除数据库记录：{}", fileUrl);
                continue;
            }

            Path file = uploadRoot.resolve(extractFileName(fileUrl)).normalize();
            if (Files.exists(file) && Files.isRegularFile(file)) {
                deleteLocalFile(file, fileUrl);
            } else {
                log.info("本地图片文件不存在，仅删除数据库记录：{}", fileUrl);
            }
        }
    }

    @Override
    public String upload(MultipartFile file) {
        String originalFilename = requireOriginalFilename(file);
        Path path = uploadRoot.resolve(getFileName(originalFilename));

        try {
            Files.createDirectories(uploadRoot);
            Files.copy(file.getInputStream(), path);
        } catch (IOException e) {
            throw new CommonException(ResultCode.ERROR_UPLOAD);
        }

        return PUBLIC_UPLOAD_PREFIX + path.getFileName();
    }

    private void deleteLocalFile(Path file, String fileUrl) {
        try {
            if (Files.deleteIfExists(file)) {
                log.info("文件删除成功：{}", fileUrl);
                return;
            }
            throw new CommonException(ResultCode.ERROR_FILE_DEL);
        } catch (IOException e) {
            throw new CommonException(ResultCode.ERROR_FILE_DEL);
        }
    }

    private String extractFileName(String fileUrl) {
        return fileUrl.substring(fileUrl.lastIndexOf(PATH_SEPARATOR) + 1);
    }

    private boolean isRemoteFile(String fileUrl) {
        return fileUrl.startsWith(HTTP_SCHEME) || fileUrl.startsWith(HTTPS_SCHEME);
    }
}
