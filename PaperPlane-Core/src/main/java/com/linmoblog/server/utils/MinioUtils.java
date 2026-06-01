package com.linmoblog.server.utils;

import cn.hutool.core.lang.UUID;
import cn.hutool.core.util.StrUtil;
import com.linmoblog.server.enums.ResultCode;
import com.linmoblog.server.exception.CommonException;
import com.linmoblog.server.minio.MinioConfig;
import io.minio.*;
import io.minio.http.Method;
import io.minio.messages.Bucket;
import io.minio.messages.Item;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.FastByteArrayOutputStream;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * MinIO 对象存储操作组件
 * @author Poison02
 * @date 2024/4/6
 */
@Data
@Component
public class MinioUtils {
    private static final Logger logger = LoggerFactory.getLogger(MinioUtils.class);
    private static final String OBJECT_NAME_PREFIX = "/blog/";
    private static final int DOWNLOAD_BUFFER_SIZE = 1024;
    private static final String CONTENT_DISPOSITION_HEADER = "Content-Disposition";
    private static final String ATTACHMENT_FILENAME_PREFIX = "attachment;fileName=";

    private final MinioConfig prop;
    private final MinioClient minioClient;

    public MinioUtils(MinioConfig prop, MinioClient minioClient) {
        this.prop = prop;
        this.minioClient = minioClient;
    }

    /**
     * 查看存储 bucket 是否存在。
     *
     * @param bucketName bucket 名称
     * @return bucket 存在时返回 true，否则返回 false
     */
    public boolean bucketExists(String bucketName) {
        try {
            return minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
        } catch (Exception e) {
            logger.error("Failed to check MinIO bucket existence: {}", bucketName, e);
            return false;
        }
    }

    /**
     * 创建存储 bucket。
     *
     * @param bucketName bucket 名称
     * @return 创建成功返回 true，否则返回 false
     */
    public boolean makeBucket(String bucketName) {
        try {
            minioClient.makeBucket(MakeBucketArgs.builder()
                    .bucket(bucketName)
                    .build());
        } catch (Exception e) {
            logger.error("Failed to create MinIO bucket: {}", bucketName, e);
            return false;
        }
        return true;
    }

    /**
     * 删除存储 bucket。
     *
     * @param bucketName bucket 名称
     * @return 删除成功返回 true，否则返回 false
     */
    public boolean removeBucket(String bucketName) {
        try {
            minioClient.removeBucket(RemoveBucketArgs.builder()
                    .bucket(bucketName)
                    .build());
        } catch (Exception e) {
            logger.error("Failed to remove MinIO bucket: {}", bucketName, e);
            return false;
        }
        return true;
    }

    /**
     * 获取全部 bucket。
     */
    public List<Bucket> getAllBuckets() {
        try {
            return minioClient.listBuckets();
        } catch (Exception e) {
            logger.error("Failed to list MinIO buckets", e);
            return null;
        }
    }


    /**
     * 文件上传
     *
     * @param file 文件
     * @return 上传后的对象名称，上传失败返回 null
     */
    public String upload(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (StringUtils.isBlank(originalFilename)) {
            throw new CommonException(ResultCode.FAILED.getCode(), "文件名不能为空");
        }
        String objectName = generateNewFileName(originalFilename);
        try {
            // 文件名称相同会覆盖
            minioClient.putObject(buildPutObjectArgs(file, objectName));
        } catch (Exception e) {
            logger.error("Failed to upload file to MinIO: {}", originalFilename, e);
            return null;
        }
        return objectName;
    }

    /**
     * 生成对象预览地址。
     *
     * @param fileName 对象名称
     * @return 预签名访问地址，生成失败返回 null
     */
    public String preview(String fileName) {
        GetPresignedObjectUrlArgs build = new GetPresignedObjectUrlArgs().builder()
                .bucket(bucketName())
                .object(fileName).method(Method.GET).build();
        try {
            return minioClient.getPresignedObjectUrl(build);
        } catch (Exception e) {
            logger.error("Failed to preview MinIO object: {}", fileName, e);
        }
        return null;
    }

    /**
     * 文件下载
     *
     * @param fileName 文件名称
     * @param res      response
     */
    public void download(String fileName, HttpServletResponse res) {
        GetObjectArgs objectArgs = GetObjectArgs.builder().bucket(bucketName())
                .object(fileName).build();
        try (GetObjectResponse response = minioClient.getObject(objectArgs)) {
            byte[] buf = new byte[DOWNLOAD_BUFFER_SIZE];
            int len;
            try (FastByteArrayOutputStream os = new FastByteArrayOutputStream()) {
                while ((len = response.read(buf)) != -1) {
                    os.write(buf, 0, len);
                }
                os.flush();
                byte[] bytes = os.toByteArray();
                res.setCharacterEncoding("utf-8");
                // 设置强制下载不打开
                // res.setContentType("application/force-download");
                res.addHeader(CONTENT_DISPOSITION_HEADER, ATTACHMENT_FILENAME_PREFIX + fileName);
                try (ServletOutputStream stream = res.getOutputStream()) {
                    stream.write(bytes);
                    stream.flush();
                }
            }
        } catch (Exception e) {
            logger.error("Failed to download MinIO object: {}", fileName, e);
        }
    }

    /**
     * 查看文件对象。
     *
     * @return 存储bucket内文件对象信息
     */
    public List<Item> listObjects() {
        Iterable<Result<Item>> results = minioClient.listObjects(
                ListObjectsArgs.builder().bucket(bucketName()).build());
        List<Item> items = new ArrayList<>();
        try {
            for (Result<Item> result : results) {
                items.add(result.get());
            }
        } catch (Exception e) {
            logger.error("Failed to list MinIO objects", e);
            return null;
        }
        return items;
    }

    /**
     * 删除文件对象。
     *
     * @param fileName 对象名称
     * @return 删除成功返回 true，否则返回 false
     */
    public boolean remove(String fileName) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucketName()).object(fileName).build());
        } catch (Exception e) {
            logger.error("Failed to remove MinIO object: {}", fileName, e);
            return false;
        }
        return true;
    }

    /**
     * 生成新文件名。
     *
     * @param originalFileName 原始文件名
     * @return 新对象名称
     */
    private String generateNewFileName(String originalFileName) {
        String suffix = StrUtil.subAfter(originalFileName, ".", true);
        return OBJECT_NAME_PREFIX + UUID.randomUUID().toString(true) + "." + suffix;
    }

    private PutObjectArgs buildPutObjectArgs(MultipartFile file, String objectName) throws IOException {
        return PutObjectArgs.builder()
                .bucket(bucketName())
                .object(objectName)
                .stream(file.getInputStream(), file.getSize(), -1)
                .contentType(file.getContentType())
                .build();
    }

    private String bucketName() {
        return prop.getBucketName();
    }

}
