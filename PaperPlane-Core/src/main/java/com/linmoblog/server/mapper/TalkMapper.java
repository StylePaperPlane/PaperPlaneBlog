package com.linmoblog.server.mapper;

import com.linmoblog.server.entity.Talk;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface TalkMapper {

    @Insert("insert into talks (talk_title,content,create_time,update_time) values(#{talkTitle},#{content},#{createTime},#{updateTime})")
    void addTalk(Talk talk);

    @Select("select * from talks")
    List<Talk> getTalkList();

    @Delete("delete from talks where talk_key = #{id}")
    void deleteTalk(Integer id);

    void updateTalk(Integer id, Talk talk);
}
