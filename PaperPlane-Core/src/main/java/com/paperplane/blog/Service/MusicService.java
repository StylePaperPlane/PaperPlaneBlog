package com.paperplane.blog.Service;

import com.paperplane.blog.Entity.MusicTrack;
import com.paperplane.blog.Entity.Result;
import com.paperplane.blog.Mapper.MusicMapper;
import com.paperplane.blog.enums.ResultCode;
import com.paperplane.blog.exception.CommonException;
import jakarta.annotation.Resource;
import org.apache.ibatis.jdbc.Null;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class MusicService {
    private static final String PUBLIC_UPLOAD_PREFIX = "uploads/music/";

    @Resource
    private MusicMapper musicMapper;

    @Value("${local.uploadDir:upload-dir}")
    private String uploadDir;

    public Result<List<MusicTrack>> getPublicTracks() {
        return Result.success(musicMapper.getPublicTracks());
    }

    public Result<List<MusicTrack>> getTracks() {
        return Result.success(musicMapper.getTracks());
    }

    public Result<MusicTrack> uploadTrack(MultipartFile file, String title, String artist, Integer sortOrder) {
        if (file == null || file.isEmpty()) {
            throw new CommonException(ResultCode.ERROR_UPLOAD);
        }

        String folder = UUID.randomUUID().toString().replace("-", "");
        Path targetDir = Paths.get(uploadDir, "music", folder).toAbsolutePath().normalize();
        MusicFiles musicFiles = extractZip(file, targetDir);
        Date now = new Date();
        MusicTrack track = new MusicTrack();
        track.setTitle(isBlank(title) ? stripExtension(musicFiles.audioFileName) : title);
        track.setArtist(artist == null ? "" : artist);
        track.setAudioUrl(PUBLIC_UPLOAD_PREFIX + folder + "/" + musicFiles.audioFileName);
        track.setCoverUrl(PUBLIC_UPLOAD_PREFIX + folder + "/" + musicFiles.coverFileName);
        track.setLyricUrl(PUBLIC_UPLOAD_PREFIX + folder + "/" + musicFiles.lyricFileName);
        track.setSortOrder(sortOrder == null ? 0 : sortOrder);
        track.setEnabled(true);
        track.setCreateTime(now);
        track.setUpdateTime(now);
        musicMapper.addTrack(track);
        return Result.success(track);
    }

    public Result<Null> updateTrack(Integer id, MusicTrack track) {
        track.setUpdateTime(new Date());
        musicMapper.updateTrack(id, track);
        return new Result<>(ResultCode.SUCCESS);
    }

    public Result<Null> deleteTracks(List<Integer> ids) {
        if (ids != null && !ids.isEmpty()) {
            musicMapper.deleteTracks(ids);
        }
        return new Result<>(ResultCode.SUCCESS);
    }

    private MusicFiles extractZip(MultipartFile file, Path targetDir) {
        MusicFiles result = new MusicFiles();
        try {
            Files.createDirectories(targetDir);
            try (InputStream inputStream = file.getInputStream(); ZipInputStream zipInputStream = new ZipInputStream(inputStream)) {
                ZipEntry entry;
                while ((entry = zipInputStream.getNextEntry()) != null) {
                    if (entry.isDirectory()) {
                        continue;
                    }
                    String rawName = Paths.get(entry.getName()).getFileName().toString();
                    if (rawName.isBlank()) {
                        continue;
                    }
                    String lowerName = rawName.toLowerCase();
                    if (!isAllowedMusicFile(lowerName)) {
                        continue;
                    }
                    Path target = targetDir.resolve(rawName).normalize();
                    if (!target.startsWith(targetDir)) {
                        throw new CommonException(ResultCode.ERROR_UPLOAD);
                    }
                    Files.copy(zipInputStream, target);
                    if (lowerName.endsWith(".mp3")) {
                        result.audioFileName = rawName;
                    } else if (lowerName.endsWith(".lrc")) {
                        result.lyricFileName = rawName;
                    } else {
                        result.coverFileName = rawName;
                    }
                }
            }
        } catch (IOException e) {
            throw new CommonException(ResultCode.ERROR_UPLOAD);
        }

        if (isBlank(result.audioFileName) || isBlank(result.lyricFileName) || isBlank(result.coverFileName)) {
            throw new CommonException(ResultCode.ERROR_UPLOAD);
        }
        return result;
    }

    private boolean isAllowedMusicFile(String fileName) {
        return fileName.endsWith(".mp3")
                || fileName.endsWith(".lrc")
                || fileName.endsWith(".jpg")
                || fileName.endsWith(".jpeg")
                || fileName.endsWith(".png")
                || fileName.endsWith(".webp");
    }

    private String stripExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static class MusicFiles {
        private String audioFileName;
        private String coverFileName;
        private String lyricFileName;
    }
}
