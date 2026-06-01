package com.linmoblog.server.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * @author : [TongJing]--------GitHub：<a href="https://github.com/defings">...</a>
 * @version : [v1.0]
 * @description : JSON 序列化工具
 * @createTime : [2024/4/6 13:58]
 * @updateUser : [TongJing]
 * @updateTime : [2024/4/6 13:58]
 * @updateRemark : [说明本次修改内容]
 */
public class JsonUtil {
    private static final ObjectMapper INSTANCE = new ObjectMapper();

    private JsonUtil() {
    }

    /**
     * 将对象转换成 JSON，如果失败则退回到对象字符串。
     */
    public static String toJsonString(Object obj) {
        try {
            return INSTANCE.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return String.valueOf(obj);
        }
    }
}
