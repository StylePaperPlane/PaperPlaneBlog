package com.linmoblog.server.controller;

import com.linmoblog.server.entity.Friend;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.service.FriendsService;
import com.linmoblog.server.aspect.ApiOperationLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api")
@Tag(name = "友情链接")
public class FriendsController {
    private final FriendsService friendsService;

    public FriendsController(FriendsService friendsService) {
        this.friendsService = friendsService;
    }

    @ApiOperationLog(description = "获取所有友情链接")
    @Operation(summary = "获取所有友情链接")
    @GetMapping("/public/friends")
    public Result<List<Friend>> getFriends() {
        return friendsService.getFriendsList();
    }

    @ApiOperationLog(description = "添加友情链接")
    @Operation(summary = "添加友情链接")
    @PostMapping("/protected/friends")
    public Result<Void> addFriend(@RequestBody Friend friend) {
        return friendsService.addFriend(friend);
    }

    @ApiOperationLog(description = "删除友情链接")
    @Operation(summary = "删除友情链接")
    @DeleteMapping("/protected/friends")
    public Result<Void> deleteFriend(@RequestBody List<Integer> friendIds) {
        return friendsService.deleteFriend(friendIds);
    }
}
