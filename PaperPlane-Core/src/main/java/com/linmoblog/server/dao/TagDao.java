package com.linmoblog.server.dao;

import com.linmoblog.server.entity.TagLevelOne;
import com.linmoblog.server.entity.TagLevelTwo;
import com.linmoblog.server.mapper.TagMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class TagDao {
    private final TagMapper tagMapper;

    public TagDao(TagMapper tagMapper) {
        this.tagMapper = tagMapper;
    }

    public List<TagLevelOne> getTagsOne() {
        return tagMapper.getTagsOne();
    }

    public List<TagLevelTwo> getTagsTwo() {
        return tagMapper.getTagsTwo();
    }

    public void addTagOne(TagLevelOne tagLevelOne) {
        tagMapper.addTagOne(tagLevelOne);
    }

    public void addTagTwo(TagLevelTwo tagLevelTwo) {
        tagMapper.addTagTwo(tagLevelTwo);
    }

    public void deleteTagTwo(Integer tag) {
        tagMapper.deleteTagTwo(tag);
    }

    public void deleteTagOne(Integer tag) {
        tagMapper.deleteTagOne(tag);
    }
}
