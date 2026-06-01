package com.linmoblog.server.dao;

import com.linmoblog.server.entity.Friend;
import com.linmoblog.server.mapper.FriendsMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class FriendsDao {

    private final FriendsMapper friendsMapper;

    public FriendsDao(FriendsMapper friendsMapper) {
        this.friendsMapper = friendsMapper;
    }

    public List<Friend> getFriendsList() {
        return friendsMapper.getFriendsList();
    }

    public void addFriend(Friend friend) {
        friendsMapper.addFriend(friend);
    }

    public void deleteFriend(List<Integer> friendIds) {
        friendsMapper.deleteFriend(friendIds);
    }
}
