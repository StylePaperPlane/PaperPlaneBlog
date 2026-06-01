package com.linmoblog.server.service;

import com.linmoblog.server.enums.ResultCode;
import com.linmoblog.server.exception.CommonException;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

public interface FileResourceService {
    String TIMESTAMP_FILE_NAME_PATTERN = "yyyyMMddHHmmssSSS";
    String EXTENSION_SEPARATOR = ".";

    String upload(MultipartFile file);

    void delete(List<String> fileUrls);

    default String requireOriginalFilename(MultipartFile file) {
        String originalFilename = file == null ? null : file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new CommonException(ResultCode.FAILED.getCode(), "文件不能为空");
        }
        return originalFilename;
    }

    default String getFileName(String originalFileName) {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern(TIMESTAMP_FILE_NAME_PATTERN))
                + EXTENSION_SEPARATOR
                + fileExtension(originalFileName);
    }

    default String fileExtension(String originalFileName) {
        return originalFileName.substring(originalFileName.lastIndexOf(EXTENSION_SEPARATOR) + 1);
    }
}
