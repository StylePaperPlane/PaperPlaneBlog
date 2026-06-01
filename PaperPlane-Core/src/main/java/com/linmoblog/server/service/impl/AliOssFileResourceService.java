package com.linmoblog.server.service.impl;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.PutObjectRequest;
import com.linmoblog.server.service.FileResourceService;
import com.linmoblog.server.enums.ResultCode;
import com.linmoblog.server.exception.CommonException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

/**
 * 使用阿里云作为存储，在配置文件中要添加  ali.enable = true 开启此配置
 *
 * @author wkq97@qq.com
 * @since 2024-04-07
 */
@Service
@Slf4j
@ConditionalOnProperty(value = "ali.enable", havingValue = "true")
public class AliOssFileResourceService implements FileResourceService {
    private static final String HTTPS_SCHEME = "https://";
    private static final String DOT = ".";
    private static final String PATH_SEPARATOR = "/";

    private final String bucket;
    private final String endpoint;
    private final String uploadPath;
    private final OSS oss;

    public AliOssFileResourceService(
            @Value("${ali.accessKey}") String accessKey,
            @Value("${ali.secretKey}") String secretKey,
            @Value("${ali.bucket}") String bucket,
            @Value("${ali.endpoint}") String endpoint,
            @Value("${ali.uploadPath}") String uploadPath
    ) {
        this.bucket = bucket;
        this.endpoint = endpoint;
        this.uploadPath = uploadPath;
        this.oss = new OSSClientBuilder().build(endpoint, accessKey, secretKey);
    }

    @Override
    public String upload(MultipartFile file) {
        String originalFilename = requireOriginalFilename(file);
        String objectName = objectNameFor(originalFilename);

        try (InputStream inputStream = file.getInputStream()) {
            oss.putObject(putObjectRequest(objectName, inputStream));
            return publicUrl(objectName);
        } catch (IOException e) {
            throw new CommonException(ResultCode.ERROR_UPLOAD);
        }
    }

    @Override
    public void delete(List<String> files) {
        if (CollectionUtils.isEmpty(files)) {
            return;
        }
        for (String filePath : files) {
            String objectName = objectNameFromPublicUrl(filePath);
            try {
                oss.deleteObject(bucket, objectName);
                log.info("文件从 OSS 删除成功：{}", filePath);
            } catch (OSSException | com.aliyun.oss.ClientException e) {
                throw new CommonException(ResultCode.ERROR_FILE_DEL);
            }

        }
    }

    private String objectNameFor(String originalFilename) {
        return uploadPath + getFileName(originalFilename);
    }

    private PutObjectRequest putObjectRequest(String objectName, InputStream inputStream) {
        return new PutObjectRequest(bucket, objectName, inputStream);
    }

    private String publicUrl(String objectName) {
        return HTTPS_SCHEME + bucket + DOT + endpoint + PATH_SEPARATOR + objectName;
    }

    private String objectNameFromPublicUrl(String filePath) {
        return filePath.substring(filePath.indexOf(endpoint) + endpoint.length());
    }
}
