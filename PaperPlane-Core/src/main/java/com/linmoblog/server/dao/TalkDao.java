package com.linmoblog.server.dao;

import com.linmoblog.server.entity.Talk;
import com.linmoblog.server.mapper.TalkMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class TalkDao {
    private final TalkMapper talkMapper;

    public TalkDao(TalkMapper talkMapper) {
        this.talkMapper = talkMapper;
    }

    public void deleteTalk(Integer id) {
        talkMapper.deleteTalk(id);
    }

    public void addTalk(Talk talk) {
        talkMapper.addTalk(talk);
    }

    public List<Talk> getTalkList() {
        return talkMapper.getTalkList();
    }

    public void updateTalk(Integer id, Talk talk) {
        talkMapper.updateTalk(id, talk);
    }
}
