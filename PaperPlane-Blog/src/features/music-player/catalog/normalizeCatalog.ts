import type {components} from '../../secure-media/api/schema';
import type {MusicCatalog, PlayerPlaylist} from '../model/playlist';
import type {MusicTrack} from '../../../interface/MusicType';
import {shuffleCopy, type RandomSource} from '../lib/shuffle';

type PublicCatalogDto = components['schemas']['PublicCatalog'];

export const normalizeCatalog = (
    catalog: PublicCatalogDto,
    random: RandomSource = Math.random,
): MusicCatalog => {
    const tracks: MusicTrack[] = catalog.tracks.map((track, index) => ({
        musicKey: track.musicKey,
        assetId: track.assetId,
        title: track.title,
        artist: track.artist,
        audioFormat: track.audioFormat,
        coverUrl: track.coverUrl ?? '',
        lyricUrl: track.lyricUrl ?? '',
        cipherUrl: track.cipherUrl,
        plaintextSize: track.plaintextSize,
        chunkSize: track.chunkSize,
        chunkCount: track.chunkCount,
        sortOrder: index,
        enabled: true,
    }));
    const byId = new Map(tracks.map(track => [track.musicKey, track]));
    const playlists: PlayerPlaylist[] = [
        {id: 'all', name: '全部歌曲', tracks: shuffleCopy(tracks, random)},
        ...catalog.playlists.map(playlist => ({
            id: playlist.playlistId,
            name: playlist.name,
            tracks: playlist.trackIds
                .map(id => byId.get(id))
                .filter((track): track is MusicTrack => Boolean(track)),
        })),
    ];
    return {tracks, playlists};
};
