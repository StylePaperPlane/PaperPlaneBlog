package com.linmoblog.server.aspect;
import java.lang.annotation.*;
/**
 * @author : [TongJing]--------GitHub：<a href="https://github.com/defings">...</a>
 * @version : [v1.0]
 * @description : 接口日志切面注解，用于记录被标记接口的入参、出参和耗时
 * @createTime : [2024/4/6 13:54]
 * @updateUser : [TongJing]
 * @updateTime : [2024/4/6 13:54]
 * @updateRemark : [说明本次修改内容]
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD})
@Documented
public @interface ApiOperationLog {
    /**
     * 接口 功能描述
     *
     * @return
     */
    String description() default "";
}
