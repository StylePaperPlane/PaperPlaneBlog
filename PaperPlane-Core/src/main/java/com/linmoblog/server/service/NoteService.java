package com.linmoblog.server.service;

import com.linmoblog.server.dao.NoteDao;
import com.linmoblog.server.entity.Note;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.bo.NoteSearchBO;
import com.linmoblog.server.entity.vo.NoteVO;
import com.linmoblog.server.entity.vo.Pair;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Date;
import java.util.List;

@Service
public class NoteService {
    private final NoteDao noteDao;

    public NoteService(NoteDao noteDao) {
        this.noteDao = noteDao;
    }

    @Transactional
    public Result<Void> addNote(Note note) {
        normalizeNewNoteTimestamps(note);
        noteDao.addNote(note);
        return Result.success();
    }

    public Result<List<Note>> getNoteList() {
        return Result.success(noteDao.getNoteList());
    }

    public Result<Void> deleteNote(List<Integer> notes) {
        noteDao.deleteNote(notes);
        return Result.success();
    }

    public Result<Void> updateNote(Integer id, Note note) {
        normalizeExistingNotePublishTime(note);
        noteDao.updateNote(id, note);
        return Result.success();
    }

    public Result<Note> getNoteById(Integer id) {
        Note note = noteDao.getNoteById(id);
        return Result.success(note);
    }

    public Result<List<Note>> getNotePages(Integer page, Integer pageSize) {
        return Result.success(noteDao.getNotePages(calculatePageStart(page, pageSize), pageSize));
    }

    public Result<List<NoteVO>> searchNote(NoteSearchBO bo) {
        return Result.success(noteDao.searchNote(bo));
    }

    public Result<List<Note>> getTopNoteList() {
        return Result.success(noteDao.getTopNoteList());
    }

    public List<Pair<Integer, Integer>> getNoteCountByCategoryKey(List<Integer> categoryKeyList) {
        if (categoryKeyList.isEmpty()) {
            return Collections.emptyList();
        }
        return noteDao.getNoteCountByCategoryKey(categoryKeyList);
    }

    private Integer calculatePageStart(Integer page, Integer pageSize) {
        return (page - 1) * pageSize;
    }

    private void normalizeNewNoteTimestamps(Note note) {
        Date now = new Date();
        if (note.getCreateTime() == null) {
            note.setCreateTime(now);
        }
        if (note.getPublishTime() == null) {
            note.setPublishTime(note.getCreateTime());
        }
        if (note.getUpdateTime() == null) {
            note.setUpdateTime(now);
        }
    }

    private void normalizeExistingNotePublishTime(Note note) {
        if (note.getPublishTime() == null && note.getCreateTime() != null) {
            note.setPublishTime(note.getCreateTime());
        }
    }
}
