package com.linmoblog.server.dao;

import com.linmoblog.server.entity.Note;
import com.linmoblog.server.entity.bo.NoteSearchBO;
import com.linmoblog.server.entity.vo.NoteVO;
import com.linmoblog.server.entity.vo.Pair;
import com.linmoblog.server.mapper.NoteMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class NoteDao {
    private final NoteMapper noteMapper;

    public NoteDao(NoteMapper noteMapper) {
        this.noteMapper = noteMapper;
    }

    public void addNote(Note note) {
        noteMapper.addNote(note);
    }

    public List<Note> getNoteList() {
        return noteMapper.getNoteList();
    }

    public void deleteNote(List<Integer> notes) {
        noteMapper.deleteNote(notes);
    }

    public void updateNote(Integer id, Note note) {
        noteMapper.updateNote(id, note);
    }

    public Note getNoteById(Integer id) {
        return noteMapper.getNoteById(id);
    }

    public List<Note> getNotePages(Integer start, Integer pageSize) {
        return noteMapper.getNotePages(start, pageSize);
    }

    public List<Note> getTopNoteList() {
        return noteMapper.getTopNoteList();
    }

    public List<NoteVO> searchNote(NoteSearchBO bo) {
        return noteMapper.searchNote(bo);
    }

    public List<Pair<Integer, Integer>> getNoteCountByCategoryKey(List<Integer> categoryKeyList) {
        return noteMapper.getNoteCountByCategoryKey(categoryKeyList);
    }
}
