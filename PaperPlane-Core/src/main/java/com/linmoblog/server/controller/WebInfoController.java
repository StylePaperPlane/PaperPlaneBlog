package com.linmoblog.server.controller;

import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.Social;
import com.linmoblog.server.entity.WebInfo;
import com.linmoblog.server.service.WebInfoService;
import com.linmoblog.server.aspect.ApiOperationLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "网站设置")
public class WebInfoController {
    private final WebInfoService webInfoService;

    public WebInfoController(WebInfoService webInfoService) {
        this.webInfoService = webInfoService;
    }

    @ApiOperationLog(description = "修改设置")
    @Operation(summary = "修改设置")
    @PostMapping("/api/protected/websetting")
    public Result<Void> updateWebInfo(@RequestBody WebInfo webInfo) {
        return webInfoService.updateWebInfo(webInfo);
    }

    @ApiOperationLog(description = "获取设置")
    @Operation(summary = "获取设置")
    @GetMapping("/api/protected/websetting")
    public Result<WebInfo> getWebInfo() {
        return webInfoService.getWebInfo();
    }

    @ApiOperationLog(description = "获取社交")
    @Operation(summary = "获取社交")
    @GetMapping("/api/public/social")
    public Result<Social> getSocial() {
        return webInfoService.getSocial();
    }
}
