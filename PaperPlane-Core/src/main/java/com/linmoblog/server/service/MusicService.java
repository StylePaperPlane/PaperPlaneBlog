package com.linmoblog.server.service;

import com.linmoblog.server.dao.MusicDao;
import com.linmoblog.server.entity.MusicTrack;
import com.linmoblog.server.entity.Result;
import com.linmoblog.server.enums.ResultCode;
import com.linmoblog.server.exception.CommonException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class MusicService {
    private static final String PUBLIC_UPLOAD_PREFIX = "uploads/music/";
    private static final String MUSIC_UPLOAD_DIR = "music";
    private static final String PATH_SEPARATOR = "/";
    private static final String EMPTY_ARTIST = "";
    private static final int DEFAULT_SORT_ORDER = 0;
    private static final String MP3_EXTENSION = ".mp3";
    private static final String LRC_EXTENSION = ".lrc";
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            MP3_EXTENSION,
            LRC_EXTENSION,
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
    );

    private final MusicDao musicDao;
    private final Path uploadRoot;

    public MusicService(MusicDao musicDao, @Value("${local.uploadDir:upload-dir}") String uploadDir) {
        this.musicDao = musicDao;
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public Result<List<MusicTrack>> getPublicTracks() {
        return Result.success(musicDao.getPublicTracks());
    }

    public Result<List<MusicTrack>> getTracks() {
        return Result.success(musicDao.getTracks());
    }

    public Result<MusicTrack> uploadTrack(MultipartFile file, String title, String artist, Integer sortOrder) {
        if (file == null || file.isEmpty()) {
            throw new CommonException(ResultCode.ERROR_UPLOAD);
        }

        String folder = UUID.randomUUID().toString().replace("-", "");
        Path targetDir = uploadDirectory(folder);
        MusicFiles musicFiles = extractZip(file, targetDir);
        Date now = new Date();
        MusicTrack track = createTrack(title, artist, sortOrder, folder, musicFiles, now);
        musicDao.addTrack(track);
        return Result.success(track);
    }

    public Result<Void> updateTrack(Integer id, MusicTrack track) {
        track.setUpdateTime(new Date());
        musicDao.updateTrack(id, track);
        return Result.success();
    }

    public Result<Void> deleteTracks(List<Integer> ids) {
        if (ids != null && !ids.isEmpty()) {
            musicDao.deleteTracks(ids);
        }
        return Result.success();
    }

    private MusicFiles extractZip(MultipartFile file, Path targetDir) {
        MusicFiles result = new MusicFiles();
        try {
            Files.createDirectories(targetDir);
            try (InputStream inputStream = file.getInputStream(); ZipInputStream zipInputStream = new ZipInputStream(inputStream)) {
                ZipEntry entry;
                while ((entry = zipInputStream.getNextEntry()) != null) {
                    processZipEntry(entry, zipInputStream, targetDir, result);
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

    private MusicTrack createTrack(String title, String artist, Integer sortOrder, String folder, MusicFiles musicFiles, Date now) {
        MusicTrack track = new MusicTrack();
        track.setTitle(isBlank(title) ? stripExtension(musicFiles.audioFileName) : title);
        track.setArtist(artist == null ? EMPTY_ARTIST : artist);
        track.setAudioUrl(publicMusicUrl(folder, musicFiles.audioFileName));
        track.setCoverUrl(publicMusicUrl(folder, musicFiles.coverFileName));
        track.setLyricUrl(publicMusicUrl(folder, musicFiles.lyricFileName));
        track.setSortOrder(sortOrder == null ? DEFAULT_SORT_ORDER : sortOrder);
        track.setEnabled(true);
        track.setCreateTime(now);
        track.setUpdateTime(now);
        return track;
    }

    private void processZipEntry(ZipEntry entry, ZipInputStream zipInputStream, Path targetDir, MusicFiles result) throws IOException {
        if (entry.isDirectory()) {
            return;
        }
        String rawName = Paths.get(entry.getName()).getFileName().toString();
        if (rawName.isBlank()) {
            return;
        }
        String lowerName = rawName.toLowerCase();
        if (!isAllowedMusicFile(lowerName)) {
            return;
        }
        Path target = targetDir.resolve(rawName).normalize();
        if (!target.startsWith(targetDir)) {
            throw new CommonException(ResultCode.ERROR_UPLOAD);
        }
        Files.copy(zipInputStream, target);
        if (isAudioFile(lowerName)) {
            result.audioFileName = rawName;
        } else if (isLyricFile(lowerName)) {
            result.lyricFileName = rawName;
        } else {
            result.coverFileName = rawName;
        }
    }

    private boolean isAllowedMusicFile(String fileName) {
        return ALLOWED_EXTENSIONS.stream().anyMatch(fileName::endsWith);
    }

    private Path uploadDirectory(String folder) {
        return uploadRoot.resolve(MUSIC_UPLOAD_DIR).resolve(folder).normalize();
    }

    private String publicMusicUrl(String folder, String fileName) {
        return PUBLIC_UPLOAD_PREFIX + folder + PATH_SEPARATOR + fileName;
    }

    private boolean isAudioFile(String fileName) {
        return fileName.endsWith(MP3_EXTENSION);
    }

    private boolean isLyricFile(String fileName) {
        return fileName.endsWith(LRC_EXTENSION);
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
