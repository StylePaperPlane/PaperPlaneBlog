package com.paperplane.blog.Mapper;

import com.paperplane.blog.Entity.Friend;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface FriendsMapper {

    @Select("select * from friends")
    List<Friend> getFriendsList();

    @Insert("insert into friends (site_name, avatar,site_url,description,status) " +
            "values(#{siteName},#{avatar},#{siteUrl},#{description},#{status}) ")
    void addFriends(Friend friend);

    void deleteFriend(List<Integer> friendKey);
}
