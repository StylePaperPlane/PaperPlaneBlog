package com.paperplane.blog.Mapper;

import com.paperplane.blog.Entity.Social;
import com.paperplane.blog.Entity.User;
import com.paperplane.blog.Entity.WebInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.springframework.transaction.annotation.Transactional;

@Mapper
public interface WebInfoMapper {

    void updateWebInfo(WebInfo webInfo);


    @Select("select * from web_info")
    WebInfo getWebInfo();

    @Update("update app_user set username = #{username},password = #{password}")
    void updateLogin(User user);

    @Select("select social_bilibili, social_email, social_github, social_netease_cloud, social_qq from web_info")
    Social getSocial();
}
