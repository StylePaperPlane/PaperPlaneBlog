package com.linmoblog.server.service;

import com.linmoblog.server.dao.FriendsDao;
import com.linmoblog.server.entity.Friend;
import com.linmoblog.server.entity.Result;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FriendsService {
    private final FriendsDao friendsDao;

    public FriendsService(FriendsDao friendsDao) {
        this.friendsDao = friendsDao;
    }

    public Result<List<Friend>> getFriendsList() {
        return Result.success(friendsDao.getFriendsList());
    }

    public Result<Void> addFriend(Friend friend) {
        friend.setStatus(1);
        friendsDao.addFriend(friend);
        return Result.success();
    }

    public Result<Void> deleteFriend(List<Integer> friendIds) {
        friendsDao.deleteFriend(friendIds);
        return Result.success();
    }
}
