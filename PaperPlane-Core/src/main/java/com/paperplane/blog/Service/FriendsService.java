package com.paperplane.blog.Service;

import com.paperplane.blog.Dao.FriendsDao;
import com.paperplane.blog.Entity.Friend;
import com.paperplane.blog.Entity.Result;
import com.paperplane.blog.enums.ResultCode;
import org.apache.ibatis.jdbc.Null;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FriendsService {
    @Autowired
    private FriendsDao friendsDao;

    public Result<List<Friend>> getFriendsList() {
        List<Friend> friends = friendsDao.getFriendsList();
        return new Result<List<Friend>>(ResultCode.SUCCESS,friends);
    }

    public Result<Null> addFriends(Friend friend) {
        friend.setStatus(1);
        friendsDao.addFriends(friend);
        return new Result<Null>(ResultCode.SUCCESS);
    }

    public Result<Null> deleteFriend(List<Integer> friendKey) {
        friendsDao.deleteFriend(friendKey);
        return new Result<Null>(ResultCode.SUCCESS);
    }
}
