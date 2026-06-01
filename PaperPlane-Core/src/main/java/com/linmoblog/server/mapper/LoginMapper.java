package com.linmoblog.server.mapper;

import com.linmoblog.server.entity.User;
import com.linmoblog.server.entity.UserInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface LoginMapper {

    @Select("select * from app_user where username = #{username}")
    User findByUsername(String username);

    @Select(("select blog_author,user_talk,user_avatar,blog_title,blog_icp from web_info"))
    UserInfo userinfo();
}
