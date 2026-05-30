package com.paperplane.blog.Mapper;

import com.paperplane.blog.Entity.MusicTrack;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MusicMapper {
    @Select("select * from music_tracks where enabled = true order by sort_order asc, music_key asc")
    List<MusicTrack> getPublicTracks();

    @Select("select * from music_tracks order by sort_order asc, music_key asc")
    List<MusicTrack> getTracks();

    @Insert("insert into music_tracks (title, artist, audio_url, cover_url, lyric_url, sort_order, enabled, create_time, update_time) " +
            "values (#{title}, #{artist}, #{audioUrl}, #{coverUrl}, #{lyricUrl}, #{sortOrder}, #{enabled}, #{createTime}, #{updateTime})")
    void addTrack(MusicTrack track);

    void updateTrack(@Param("id") Integer id, @Param("track") MusicTrack track);

    void deleteTracks(@Param("musicKeyList") List<Integer> musicKeyList);
}
