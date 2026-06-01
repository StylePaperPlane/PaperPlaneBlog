package com.linmoblog.server.service;

import com.linmoblog.server.dao.TagDao;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.TagLevelOne;
import com.linmoblog.server.entity.TagLevelTwo;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TagService {
    private static final int LEVEL_TWO_TAG_KEY_THRESHOLD = 100;

    private final TagDao tagDao;

    public TagService(TagDao tagDao) {
        this.tagDao = tagDao;
    }

    public Result<List<TagLevelOne>> getTagsOne() {
        return Result.success(tagDao.getTagsOne());
    }

    public Result<List<TagLevelTwo>> getTagsTwo() {
        return Result.success(tagDao.getTagsTwo());
    }

    public Result<Void> addTagOne(TagLevelOne tagLevelOne) {
        tagDao.addTagOne(tagLevelOne);
        return Result.success();
    }

    public Result<Void> addTagsTwo(TagLevelTwo tagLevelTwo) {
        tagDao.addTagTwo(tagLevelTwo);
        return Result.success();
    }

    public Result<Void> deleteTags(List<Integer> tags) {
        for (Integer tag : tags) {
            if (isLevelTwoTag(tag)) {
                tagDao.deleteTagTwo(tag);
            } else {
                tagDao.deleteTagOne(tag);
            }
        }
        return Result.success();
    }

    private boolean isLevelTwoTag(Integer tag) {
        return tag > LEVEL_TWO_TAG_KEY_THRESHOLD;
    }
}
