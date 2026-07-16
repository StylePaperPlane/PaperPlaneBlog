import {CheckOutlined, CloseOutlined, PlusOutlined} from '@ant-design/icons';
import {FormEvent, useState} from 'react';
import type {PlayerPlaylistId} from '../../../../features/music-player/model/playlist';
import type {AdminPlaylist} from '../lib/adminPlaylist';

interface PlaylistRailProps {
    playlists: AdminPlaylist[];
    selectedId: PlayerPlaylistId;
    allTrackCount: number;
    loading: boolean;
    onSelect: (id: PlayerPlaylistId) => void;
    onCreate: (name: string) => Promise<void>;
}

const PlaylistRail = ({playlists, selectedId, allTrackCount, loading, onSelect, onCreate}: PlaylistRailProps) => {
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!name.trim()) return;
        setSubmitting(true);
        try {
            await onCreate(name);
            setName('');
            setCreating(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <aside className="playlist-rail" aria-label="歌单目录" aria-busy={loading}>
            <div className="playlist-rail-heading">
                <strong>歌单</strong>
                <button type="button" onClick={() => setCreating(true)} aria-label="新建歌单" title="新建歌单">
                    <PlusOutlined />
                </button>
            </div>
            {creating && (
                <form className="playlist-create-row" onSubmit={event => void submit(event)}>
                    <input
                        autoFocus
                        value={name}
                        maxLength={60}
                        onChange={event => setName(event.target.value)}
                        placeholder="歌单名称"
                        aria-label="新歌单名称"
                    />
                    <button type="submit" disabled={submitting || !name.trim()} aria-label="确认创建歌单"><CheckOutlined /></button>
                    <button type="button" onClick={() => { setCreating(false); setName(''); }} aria-label="取消创建歌单"><CloseOutlined /></button>
                </form>
            )}
            <nav className="playlist-rail-list">
                <button
                    type="button"
                    className={selectedId === 'all' ? 'current' : ''}
                    onClick={() => onSelect('all')}
                    aria-current={selectedId === 'all' ? 'page' : undefined}
                >
                    <span>全部歌曲</span><small>{allTrackCount}</small>
                </button>
                {playlists.map(playlist => (
                    <button
                        type="button"
                        key={playlist.playlistId}
                        className={selectedId === playlist.playlistId ? 'current' : ''}
                        onClick={() => onSelect(playlist.playlistId)}
                        aria-current={selectedId === playlist.playlistId ? 'page' : undefined}
                    >
                        <span>{playlist.name}</span><small>{playlist.trackIds.length}</small>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default PlaylistRail;
