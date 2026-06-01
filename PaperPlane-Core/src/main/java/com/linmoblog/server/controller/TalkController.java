package com.linmoblog.server.controller;

import com.linmoblog.server.entity.Talk;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.service.TalkService;
import com.linmoblog.server.aspect.ApiOperationLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping(value = "/api")
@RestController
@Tag(name = "说说接口")
@Slf4j
public class TalkController {
    private final TalkService talkService;

    public TalkController(TalkService talkService) {
        this.talkService = talkService;
    }

    @ApiOperationLog(description = "添加说说")
    @Operation(summary = "添加说说")
    @PostMapping("/protect/talk")
    public Result<Void> addTalk(@RequestBody Talk talk) {
        logTalkMutation("Adding talk", talk);
        return talkService.addTalk(talk);
    }

    @ApiOperationLog(description = "获取说说")
    @Operation(summary = "获取说说")
    @GetMapping("/public/talk")
    public Result<List<Talk>> getTalkList() {
        return talkService.getTalkList();
    }

    @ApiOperationLog(description = "删除说说")
    @Operation(summary = "删除说说")
    @DeleteMapping("/protect/talk/{id}")
    public Result<Void> deleteTalk(@PathVariable Integer id) {
        return talkService.deleteTalk(id);
    }

    @ApiOperationLog(description = "修改说说")
    @Operation(summary = "修改说说")
    @PostMapping("/protect/talk/{id}")
    public Result<Void> updateTalk(@PathVariable Integer id, @RequestBody Talk talk) {
        logTalkMutation("Updating talk id " + id, talk);
        return talkService.updateTalk(id, talk);
    }

    private void logTalkMutation(String action, Talk talk) {
        log.debug("{}: {}", action, talk);
    }
}
