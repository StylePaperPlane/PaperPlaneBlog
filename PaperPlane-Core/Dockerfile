FROM eclipse-temurin:17-jre-alpine
# 设置工作目录
WORKDIR /paperplane
# 将编译好的 Spring Boot JAR 文件复制到容器中。
COPY target/PaperPlane-Core-1.0.0.jar /paperplane/PaperPlane-Core-1.0.0.jar

# 设置环境变量
ENV ENV_VARIABLE_NAME=value

# 暴露 Spring Boot 应用程序的端口
EXPOSE 8080

# 定义容器启动命令
CMD ["java", "-jar", "PaperPlane-Core-1.0.0.jar"]
