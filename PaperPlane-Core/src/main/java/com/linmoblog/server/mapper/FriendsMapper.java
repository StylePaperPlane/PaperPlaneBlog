package com.linmoblog.server.mapper;

import com.linmoblog.server.entity.Friend;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface FriendsMapper {

    @Select("select * from friends")
    List<Friend> getFriendsList();

    @Insert("insert into friends (site_name, avatar,site_url,description,status) " +
            "values(#{siteName},#{avatar},#{siteUrl},#{description},#{status}) ")
    void addFriend(Friend friend);

    void deleteFriend(@Param("friendIds") List<Integer> friendIds);
}
