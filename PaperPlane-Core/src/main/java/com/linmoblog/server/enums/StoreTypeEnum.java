package com.linmoblog.server.enums;

import java.util.Arrays;
import java.util.Objects;

/**
 * @author wkq97@qq.com
 */
public enum StoreTypeEnum {
    LOCAL("local"),

    ALI("ali");

    private final String code;

    StoreTypeEnum(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    /**
     * 根据 code 获取 enum
     */
    public static StoreTypeEnum getEnumByCode(String code) {
        return Arrays.stream(values())
                .filter(storeTypeEnum -> Objects.equals(code, storeTypeEnum.code))
                .findFirst()
                .orElse(null);
    }

}
