package com.paperplane.blog.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.paperplane.blog.Dao.TagDao;
import com.paperplane.blog.Entity.Result;
import com.paperplane.blog.Entity.TagLevelOne;
import com.paperplane.blog.Entity.TagLevelTwo;
import com.paperplane.blog.enums.ResultCode;
import org.apache.ibatis.jdbc.Null;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TagService {
    @Autowired
    private TagDao tagDao;

    public Result<List<TagLevelOne>> getTagsOne() {
        List<TagLevelOne> result = tagDao.getTagsOne();
        return new Result<>(ResultCode.SUCCESS, result);
    }

    public Result<List<TagLevelTwo>> getTagsTwo() {
        List<TagLevelTwo> result = tagDao.getTagsTwo();
        return new Result<>(ResultCode.SUCCESS, result);
    }

    public Result<Null> addTagOne(TagLevelOne tagLevelOne) {
        tagDao.addTagOne(tagLevelOne);
        return new Result<>(ResultCode.SUCCESS);
    }

    public Result<Null> addTagsTwo(TagLevelTwo tagLevelTwo) {
        tagDao.addTagTwo(tagLevelTwo);
        return new Result<>(ResultCode.SUCCESS);
    }

    public Result<Null> deleteTags(List<Integer> tags) {
        for(Integer tag : tags){
            if(tag>100){
                tagDao.deleteTagTwo(tag);
            }else{
                tagDao.deleteTagOne(tag);
            }
        }
        return new Result<>(ResultCode.SUCCESS);
    }
}
