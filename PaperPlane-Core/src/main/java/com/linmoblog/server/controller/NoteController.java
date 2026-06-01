package com.linmoblog.server.controller;

import com.linmoblog.server.entity.Note;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.entity.bo.NoteSearchBO;
import com.linmoblog.server.entity.vo.NoteVO;
import com.linmoblog.server.service.NoteService;
import com.linmoblog.server.aspect.ApiOperationLog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping(value = "/api")
@RestController
@Tag(name = "文章接口")
public class NoteController {
    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @ApiOperationLog(description = "添加文章接口")
    @Operation(summary = "添加文章")
    @PostMapping("/protected/notes")
    public Result<Void> addNote(@RequestBody Note note) {
        return noteService.addNote(note);
    }

    @ApiOperationLog(description = "获取所有文章")
    @Operation(summary = "获取所有文章")
    @GetMapping("/public/notes")
    public Result<List<Note>> getNoteList() {
        return noteService.getNoteList();
    }

    @ApiOperationLog(description = "获取加精文章")
    @Operation(summary = "获取加精文章")
    @GetMapping("/public/topnotes")
    public Result<List<Note>> getTopNoteList() {
        return noteService.getTopNoteList();
    }

    @ApiOperationLog(description = "根据id获取文章")
    @Operation(summary = "根据id获取文章")
    @GetMapping("/public/notes/{id}")
    public Result<Note> getNoteById(@PathVariable Integer id) {
        return noteService.getNoteById(id);
    }

    @ApiOperationLog(description = "分页获取文章")
    @Operation(summary = "分页获取文章")
    @GetMapping("/public/notes/page")
    public Result<List<Note>> getNotePages(@RequestParam(defaultValue = "1") Integer page,
                                           @RequestParam(defaultValue = "4") Integer pageSize) {
        return noteService.getNotePages(page, pageSize);
    }

    @ApiOperationLog(description = "删除文章")
    @Operation(summary = "删除文章")
    @DeleteMapping("/protected/notes")
    public Result<Void> deleteNote(@RequestBody List<Integer> notes) {
        return noteService.deleteNote(notes);
    }

    @ApiOperationLog(description = "修改文章")
    @Operation(summary = "修改文章")
    @PostMapping("/protected/notes/{id}")
    public Result<Void> updateNote(@PathVariable Integer id, @RequestBody Note note) {
        return noteService.updateNote(id, note);
    }

    @ApiOperationLog(description = "搜索文章")
    @Operation(summary = "搜索文章")
    @PostMapping("/public/notes/search")
    public Result<List<NoteVO>> searchNote(@RequestBody NoteSearchBO query) {
        return noteService.searchNote(query);
    }
}
