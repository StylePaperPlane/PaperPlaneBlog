package com.linmoblog.server.aspect;

import com.linmoblog.server.utils.JsonUtil;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.aspectj.lang.reflect.MethodSignature;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * @author : [TongJing]--------GitHub：<a href="https://github.com/defings">...</a>
 * @version : [v1.0]
 * @description : 接口日志切面，统一记录接口调用上下文与执行耗时
 * @createTime : [2024/4/6 14:01]
 * @updateUser : [TongJing]
 * @updateTime : [2024/4/6 14:01]
 * @updateRemark : [说明本次修改内容]
 */
@Aspect
@Component
@Slf4j
public class ApiOperationLogAspect {
    /**
     * 自定义切点，凡是添加该注解，都会执行环绕中的代码。
     */
    @Pointcut("@annotation(com.linmoblog.server.aspect.ApiOperationLog)")
    public void apiOperationLog() {
    }

    /**
     * 环绕通知，记录接口入参、出参与耗时。
     */
    @Around("apiOperationLog()")
    public Object doAround(ProceedingJoinPoint joinPoint) throws Throwable {
        try {
            long startTime = currentTimeMillis();
            attachTraceId();
            String className = joinPoint.getTarget().getClass().getSimpleName();
            String methodName = joinPoint.getSignature().getName();

            Object[] args = joinPoint.getArgs();
            String argsStr = Arrays.stream(args)
                    .map(JsonUtil::toJsonString)
                    .collect(Collectors.joining(", "));
            String description = descriptionOf(joinPoint);
            log.info("================ 请求开始：[{}]，入参：{}，请求类：{}，请求方法：{} ================",
                    description, argsStr, className, methodName);

            Object result = joinPoint.proceed();
            long executionTime = elapsedMillis(startTime);

            log.info("====== 请求结束: [{}], 耗时: {}ms, 出参: {} =================================== ",
                    description, executionTime, JsonUtil.toJsonString(result));

            return result;

        } finally {
            MDC.clear();
        }
    }

    private void attachTraceId() {
        MDC.put("traceId", UUID.randomUUID().toString());
    }

    private long elapsedMillis(long startTime) {
        return currentTimeMillis() - startTime;
    }

    private long currentTimeMillis() {
        return System.currentTimeMillis();
    }

    /**
     * 获取注解的描述信息
     * @param joinPoint 当前切点
     * @return 接口日志描述
     */
    private String descriptionOf(ProceedingJoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        ApiOperationLog apiOperationLog = method.getAnnotation(ApiOperationLog.class);
        return apiOperationLog.description();
    }
}
