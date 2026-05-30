package com.paperplane.blog.Dao;

import com.paperplane.blog.Entity.Friend;
import com.paperplane.blog.Mapper.FriendsMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class FriendsDao {

    @Autowired
    private FriendsMapper friendsMapper;

    public List<Friend> getFriendsList() {
        return friendsMapper.getFriendsList();
    }

    public void addFriends(Friend friend) {
        friendsMapper.addFriends(friend);
    }

    public void deleteFriend(List<Integer> friendKey) {
        friendsMapper.deleteFriend(friendKey);
    }
}
