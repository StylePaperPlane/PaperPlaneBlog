import type {components} from '../../../../features/secure-media/api/schema';
import {mediaBaseUrl} from '../../../../features/secure-media/api/client';
import type {MusicTrack} from '../../../../interface/MusicType';

export type AdminTrackDto = components['schemas']['AdminTrack'];

const mediaObjectUrl = (path: string | null | undefined) => {
    if (!path) return '';
    return `${mediaBaseUrl.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
};

export const toMusicTrack = (track: AdminTrackDto): MusicTrack => ({
    musicKey: track.musicKey,
    assetId: track.assetId,
    title: track.title,
    artist: track.artist,
    audioFormat: track.audioFormat,
    coverUrl: mediaObjectUrl(track.coverPath),
    lyricUrl: mediaObjectUrl(track.lyricPath),
    sortOrder: track.sortOrder,
    enabled: track.enabled,
    createTime: track.createdAt,
    updateTime: track.updatedAt,
});
