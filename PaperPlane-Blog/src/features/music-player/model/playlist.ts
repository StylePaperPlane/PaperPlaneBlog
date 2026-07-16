import type {MusicTrack} from '../../../interface/MusicType';

export type PlayerPlaylistId = 'all' | number;

export interface PlayerPlaylist {
    id: PlayerPlaylistId;
    name: string;
    tracks: MusicTrack[];
}

export interface MusicCatalog {
    tracks: MusicTrack[];
    playlists: PlayerPlaylist[];
}

export type PlayerContentMode = 'lyrics' | 'playlist' | null;
