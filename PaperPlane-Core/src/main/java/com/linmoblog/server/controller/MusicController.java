package com.linmoblog.server.controller;

import com.linmoblog.server.entity.MusicTrack;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.service.MusicService;
import com.linmoblog.server.aspect.ApiOperationLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RequestMapping(value = "/api")
@RestController
@Tag(name = "音乐接口")
public class MusicController {
    private final MusicService musicService;

    public MusicController(MusicService musicService) {
        this.musicService = musicService;
    }

    @Operation(summary = "获取公开音乐列表")
    @GetMapping("/public/music")
    public Result<List<MusicTrack>> getPublicTracks() {
        return musicService.getPublicTracks();
    }

    @ApiOperationLog(description = "获取音乐管理列表")
    @Operation(summary = "获取音乐管理列表")
    @GetMapping("/protected/music")
    public Result<List<MusicTrack>> getTracks() {
        return musicService.getTracks();
    }

    @ApiOperationLog(description = "上传音乐zip")
    @Operation(summary = "上传音乐zip")
    @PostMapping("/protected/music/upload")
    public Result<MusicTrack> uploadTrack(
            @RequestParam MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String artist,
            @RequestParam(required = false) Integer sortOrder) {
        return musicService.uploadTrack(file, title, artist, sortOrder);
    }

    @ApiOperationLog(description = "更新音乐")
    @Operation(summary = "更新音乐")
    @PostMapping("/protected/music/{id}")
    public Result<Void> updateTrack(@PathVariable Integer id, @RequestBody MusicTrack track) {
        return musicService.updateTrack(id, track);
    }

    @ApiOperationLog(description = "删除音乐")
    @Operation(summary = "删除音乐")
    @DeleteMapping("/protected/music")
    public Result<Void> deleteTracks(@RequestBody List<Integer> ids) {
        return musicService.deleteTracks(ids);
    }
}
