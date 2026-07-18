import type {MusicTrack} from '../../../interface/MusicType';
import type {PlayerContentMode, PlayerPlaylist, PlayerPlaylistId} from '../model/playlist';
import type {LyricLine} from '../model/types';
import LyricsView from './LyricsView';
import PlaylistBrowser from './PlaylistBrowser';
import AnimatedPlayerContent from './AnimatedPlayerContent';

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
    let content = null;
    if (props.mode === 'lyrics') {
        content = <LyricsView title={props.currentTrack.title} lyrics={props.lyrics} currentTime={props.currentTime} />;
    }
    if (props.mode === 'playlist') {
        content = (
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
    return <AnimatedPlayerContent mode={props.mode}>{content}</AnimatedPlayerContent>;
};

export default PlayerContent;
