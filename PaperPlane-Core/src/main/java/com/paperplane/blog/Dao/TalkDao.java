package com.paperplane.blog.Dao;

import com.paperplane.blog.Entity.Talk;
import com.paperplane.blog.Mapper.TalkMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class TalkDao {
    @Autowired
    private TalkMapper talkMapper;

    public void delTalk(int id) {
        talkMapper.delTalk(id);
    }

    public void addTalk(Talk talk) {
        talkMapper.addTalk(talk);
    }

    public List<Talk> getTalkList() {
        return talkMapper.getTalkList();
    }

    public void updateTalk(Integer id,Talk talk) {
        talkMapper.updateTalk(id,talk);
    }
}
