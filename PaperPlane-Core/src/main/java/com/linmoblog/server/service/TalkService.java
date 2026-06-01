package com.linmoblog.server.service;

import com.linmoblog.server.dao.TalkDao;
import com.linmoblog.server.entity.Talk;
import com.linmoblog.server.entity.Result;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TalkService {
    private final TalkDao talkDao;

    public TalkService(TalkDao talkDao) {
        this.talkDao = talkDao;
    }

    public Result<Void> addTalk(Talk talk) {
        talkDao.addTalk(talk);
        return Result.success();
    }

    public Result<List<Talk>> getTalkList() {
        return Result.success(talkDao.getTalkList());
    }

    public Result<Void> deleteTalk(Integer id) {
        talkDao.deleteTalk(id);
        return Result.success();
    }

    public Result<Void> updateTalk(Integer id, Talk talk) {
        talkDao.updateTalk(id, talk);
        return Result.success();
    }
}
