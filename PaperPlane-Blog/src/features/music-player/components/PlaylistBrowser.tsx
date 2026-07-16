import {DownOutlined, UpOutlined} from '@ant-design/icons';
import {useState} from 'react';
import type {MusicTrack} from '../../../interface/MusicType';
import type {PlayerPlaylist, PlayerPlaylistId} from '../model/playlist';

interface PlaylistBrowserProps {
    playlists: PlayerPlaylist[];
    selectedId: PlayerPlaylistId;
    tracks: MusicTrack[];
    currentTrack?: MusicTrack;
    onSelectPlaylist: (id: PlayerPlaylistId) => void;
    onSelectTrack: (musicKey: number) => void;
}

const PlaylistBrowser = ({
    playlists,
    selectedId,
    tracks,
    currentTrack,
    onSelectPlaylist,
    onSelectTrack,
}: PlaylistBrowserProps) => {
    const [choosing, setChoosing] = useState(false);
    const selectedName = playlists.find(playlist => playlist.id === selectedId)?.name ?? '全部歌曲';

    return (
        <div className="musicPlaylistBrowser">
            <button
                className="musicPlaylistSelector"
                type="button"
                onClick={() => setChoosing(value => !value)}
                aria-label={`选择歌单，当前为${selectedName}`}
                aria-expanded={choosing}
            >
                <span>当前歌单</span>
                <strong>{selectedName}</strong>
                {choosing ? <UpOutlined /> : <DownOutlined />}
            </button>
            {choosing && (
                <div className="musicPlaylistOptions" role="listbox" aria-label="可选歌单">
                    {playlists.map(playlist => (
                        <button
                            type="button"
                            key={playlist.id}
                            role="option"
                            aria-selected={playlist.id === selectedId}
                            className={playlist.id === selectedId ? 'current' : ''}
                            onClick={() => {
                                onSelectPlaylist(playlist.id);
                                setChoosing(false);
                            }}
                        >
                            <span>{playlist.name}</span>
                            <small>{playlist.tracks.length} 首</small>
                        </button>
                    ))}
                </div>
            )}
            {!choosing && (
                <div className="musicContentScroll musicTrackList" role="list" aria-label={`${selectedName}歌曲列表`}>
                    {tracks.map((track, index) => {
                        const current = track.musicKey === currentTrack?.musicKey;
                        return (
                            <button
                                type="button"
                                role="listitem"
                                key={track.musicKey}
                                className={current ? 'current' : ''}
                                aria-label={`${current ? '当前歌曲，' : '播放'}${track.title}，${track.artist || '未知歌手'}`}
                                aria-current={current ? 'true' : undefined}
                                onClick={() => onSelectTrack(track.musicKey)}
                            >
                                <span className="trackIndex">{String(index + 1).padStart(2, '0')}</span>
                                <span className="trackText">
                                    <strong>{track.title}</strong>
                                    <small>{track.artist || '未知歌手'}</small>
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PlaylistBrowser;
