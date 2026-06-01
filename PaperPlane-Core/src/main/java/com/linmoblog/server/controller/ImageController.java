package com.linmoblog.server.controller;

import com.linmoblog.server.entity.Image;
import com.linmoblog.server.entity.ImageFolder;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.bo.ImageMoveBO;
import com.linmoblog.server.service.ImageService;
import com.linmoblog.server.aspect.ApiOperationLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping(value = "/api/protect")
@Tag(name = "图片接口")
public class ImageController {
    private final ImageService imageService;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    @ApiOperationLog(description = "图片上传")
    @Operation(summary = "图片上传")
    @PostMapping("/upload")
    public Result<String> upload(@RequestParam("file") MultipartFile file, @RequestParam(value = "folderName", required = false) String folderName) {
        return imageService.upload(file, folderName);
    }

    @ApiOperationLog(description = "图片删除")
    @Operation(summary = "图片删除")
    @DeleteMapping("/delImg")
    public Result<Void> deleteImages(@RequestBody List<String> imageUrls) {
        return imageService.deleteImages(imageUrls);
    }

    @ApiOperationLog(description = "获取所有图片")
    @Operation(summary = "获取所有图片")
    @GetMapping("/images")
    public Result<List<Image>> getImages(@RequestParam(required = false) String folderName) {
        return imageService.getImages(folderName);
    }

    @ApiOperationLog(description = "新建图片文件夹")
    @Operation(summary = "新建图片文件夹")
    @PostMapping("/imageFolders")
    public Result<Void> createFolder(@RequestParam String folderName) {
        return imageService.createFolder(folderName);
    }

    @ApiOperationLog(description = "获取图片文件夹")
    @Operation(summary = "获取图片文件夹")
    @GetMapping("/imageFolders")
    public Result<List<ImageFolder>> getFolders() {
        return imageService.getFolders();
    }

    @ApiOperationLog(description = "移动图片到文件夹")
    @Operation(summary = "移动图片到文件夹")
    @PutMapping("/images/folder")
    public Result<Void> moveImages(@RequestBody ImageMoveBO bo) {
        return imageService.moveImages(bo.getImageUrls(), bo.getFolderName());
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<FileSystemResource> downloadFile(@PathVariable String filename) {
        FileSystemResource file = imageService.getDownloadResource(filename);

        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"").body(file);
    }
}
