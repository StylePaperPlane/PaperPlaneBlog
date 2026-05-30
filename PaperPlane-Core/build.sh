#!/bin/bash


# 构建 Spring Boot 项目并生成 JAR 文件
echo "Building Spring Boot project..."
./mvnw clean package -DskipTests

# 检查构建是否成功
if [ $? -ne 0 ]; then
  echo "Failed to build Spring Boot project. Exiting..."
  exit 1
fi

# 启动 Docker Compose
echo "Starting Docker Compose..."
docker-compose up
