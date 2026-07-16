import type {MusicTrack} from '../../../interface/MusicType';
import type {PlayerContentMode, PlayerPlaylist, PlayerPlaylistId} from '../model/playlist';
import type {LyricLine} from '../model/types';
import LyricsView from './LyricsView';
import PlaylistBrowser from './PlaylistBrowser';

interface PlayerContentProps {
    mode: PlayerContentMode;
    currentTrack: MusicTrack;
    currentTime: number;
    lyrics: LyricLine[];
    playlists: PlayerPlaylist[];
    selectedPlaylistId: PlayerPlaylistId;
    tracks: MusicTrack[];
    onSelectPlaylist: (id: PlayerPlaylistId) => void;
    onSelectTrack: (musicKey: number) => void;
}

const PlayerContent = (props: PlayerContentProps) => {
    if (props.mode === 'lyrics') {
        return <LyricsView title={props.currentTrack.title} lyrics={props.lyrics} currentTime={props.currentTime} />;
    }
    if (props.mode === 'playlist') {
        return (
            <PlaylistBrowser
                playlists={props.playlists}
                selectedId={props.selectedPlaylistId}
                tracks={props.tracks}
                currentTrack={props.currentTrack}
                onSelectPlaylist={props.onSelectPlaylist}
                onSelectTrack={props.onSelectTrack}
            />
        );
    }
    return null;
};

export default PlayerContent;
