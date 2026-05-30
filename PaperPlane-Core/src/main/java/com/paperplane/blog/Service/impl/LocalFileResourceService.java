package com.paperplane.blog.Service.impl;

import com.paperplane.blog.Service.FileResourceService;
import com.paperplane.blog.enums.ResultCode;
import com.paperplane.blog.exception.CommonException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;

/**
 * 使用本地存储，在配置文件中要添加 local.enable = true
 *
 * @since 2024-04-07
 */
@Service
@Slf4j
@ConditionalOnProperty(value = "local.enable", havingValue = "true")
public class LocalFileResourceService implements FileResourceService {

    private static final String PUBLIC_UPLOAD_PREFIX = "uploads/";

    @Value("${local.uploadDir}")
    private String uploadDir;


    @Override
    public void delete(List<String> files) {
        if (CollectionUtils.isEmpty(files)) {
            return;
        }

        for (String fileUrl : files) {
            if (fileUrl == null || fileUrl.isBlank()) {
                continue;
            }
            if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
                log.info("跳过远程图片文件删除，仅删除数据库记录：" + fileUrl);
                continue;
            }

            String fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            File file = Paths.get(uploadDir, fileName).toFile();
            if (file.exists() && file.isFile()) {
                if (file.delete()) {
                    log.info("文件删除成功：" + fileUrl);
                } else {
                    throw new CommonException(ResultCode.ERROR_FILE_DEL);
                }
            } else {
                log.info("本地图片文件不存在，仅删除数据库记录：" + fileUrl);
            }
        }
    }

    @Override
    public String upload(MultipartFile file) {
        // 创建目录（如果不存在）
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        Path path = null;
        if (uploadDir != null) {
            path = Paths.get(uploadDir).resolve(getFileName(Objects.requireNonNull(file.getOriginalFilename())));
        }

        // 保存文件
        try {
            if (path != null) {
                Files.copy(file.getInputStream(), path);
            } else {
                throw new CommonException(ResultCode.ERROR_UPLOAD);
            }
        } catch (IOException e) {
            throw new CommonException(ResultCode.ERROR_UPLOAD);
        }

        return PUBLIC_UPLOAD_PREFIX + path.getFileName();
    }
}
