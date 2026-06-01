package com.linmoblog.server.entity;

import com.linmoblog.server.enums.ResultCode;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
public class Result<T> {
    private int code;
    private String message;
    private T data;

    public Result(ResultCode resultCode) {
        this.code = resultCode.getCode();
        this.message = resultCode.getMessage();
    }

    public Result(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public Result(ResultCode resultCode, T data) {
        this.code = resultCode.getCode();
        this.message = resultCode.getMessage();
        this.data = data;
    }


    public static Result<Void> success() {
        return new Result<>(ResultCode.SUCCESS);
    }

    public static <T> Result<T> success(T data) {
        return new Result<>(ResultCode.SUCCESS, data);
    }

    public static <T> Result<T> error() {
        return new Result<>(ResultCode.FAILED);
    }

    public static <T> Result<T> error(String msg) {
        return new Result<>(ResultCode.FAILED.getCode(), msg);
    }
}
