package com.linmoblog.server.controller;

import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.TagLevelOne;
import com.linmoblog.server.entity.TagLevelTwo;
import com.linmoblog.server.service.TagService;
import com.linmoblog.server.aspect.ApiOperationLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping(value = "/api")
@RestController
@Tag(name = "标签接口")
public class TagController {
    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @ApiOperationLog(description = "获取一级标签")
    @Operation(summary = "获取一级标签")
    @GetMapping("/public/tagone")
    public Result<List<TagLevelOne>> getTagsOne() {
        return tagService.getTagsOne();
    }

    @ApiOperationLog(description = "获取二级标签")
    @Operation(summary = "获取二级标签")
    @GetMapping("/public/tagtwo")
    public Result<List<TagLevelTwo>> getTagsTwo() {
        return tagService.getTagsTwo();
    }

    @ApiOperationLog(description = "添加一级标签")
    @Operation(summary = "添加一级标签")
    @PostMapping("/protected/tagone")
    public Result<Void> addTagOne(@RequestBody TagLevelOne tagLevelOne) {
        return tagService.addTagOne(tagLevelOne);
    }

    @ApiOperationLog(description = "添加二级标签")
    @Operation(summary = "添加二级标签")
    @PostMapping("/protected/tagtwo")
    public Result<Void> addTagTwo(@RequestBody TagLevelTwo tagLevelTwo) {
        return tagService.addTagsTwo(tagLevelTwo);
    }

    @ApiOperationLog(description = "删除标签")
    @Operation(summary = "删除标签")
    @DeleteMapping("/protected/tag")
    public Result<Void> deleteTag(@RequestBody List<Integer> tags) {
        return tagService.deleteTags(tags);
    }
}
