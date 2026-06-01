package com.linmoblog.server.dao;

import com.linmoblog.server.entity.MusicTrack;
import com.linmoblog.server.mapper.MusicMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class MusicDao {
    private final MusicMapper musicMapper;

    public MusicDao(MusicMapper musicMapper) {
        this.musicMapper = musicMapper;
    }

    public List<MusicTrack> getPublicTracks() {
        return musicMapper.getPublicTracks();
    }

    public List<MusicTrack> getTracks() {
        return musicMapper.getTracks();
    }

    public void addTrack(MusicTrack track) {
        musicMapper.addTrack(track);
    }

    public void updateTrack(Integer id, MusicTrack track) {
        musicMapper.updateTrack(id, track);
    }

    public void deleteTracks(List<Integer> ids) {
        musicMapper.deleteTracks(ids);
    }
}
