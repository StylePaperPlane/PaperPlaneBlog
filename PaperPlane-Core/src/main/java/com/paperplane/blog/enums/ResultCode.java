package com.paperplane.blog.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum ResultCode {
    // 成功响应
    SUCCESS(200, "ok"),
    FAILED(500, "failed"),
    SUCCESS_UPLOAD(200, "上传成功"),
    SUCCESS_LOGIN(200, "Login successful"),
    SUCCESS_FILE_DEL(200, "文件删除成功"),

    // 失败响应
    ERROR_LOGIN(401, "Login failed"),
    ERROR_UPLOAD(508, "上传失败"),
    ERROR_FILE_DEL(509, "文件删除失败");
    private final int code;
    private final String message;
}
