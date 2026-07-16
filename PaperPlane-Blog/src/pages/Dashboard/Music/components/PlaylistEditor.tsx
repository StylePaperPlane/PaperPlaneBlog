import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import {Popconfirm} from 'antd';
import {useEffect, useMemo, useState} from 'react';
import type {MusicTrack} from '../../../../interface/MusicType';
import {resolveMusicUrl} from '../../../../utils/musicUrl';
import type {AdminPlaylist} from '../lib/adminPlaylist';
import {moveTrack} from '../lib/adminPlaylist';

interface PlaylistEditorProps {
    playlist: AdminPlaylist;
    tracks: MusicTrack[];
    saving: boolean;
    onRename: (name: string) => Promise<void>;
    onDelete: () => Promise<void>;
    onTrackIdsChange: (trackIds: number[]) => Promise<void>;
}

const PlaylistEditor = ({playlist, tracks, saving, onRename, onDelete, onTrackIdsChange}: PlaylistEditorProps) => {
    const [renaming, setRenaming] = useState(false);
    const [name, setName] = useState(playlist.name);
    const byId = useMemo(() => new Map(tracks.map(track => [track.musicKey, track])), [tracks]);
    const assigned = playlist.trackIds.map(id => byId.get(id)).filter((track): track is MusicTrack => Boolean(track));
    const assignedIds = useMemo(() => new Set(playlist.trackIds), [playlist.trackIds]);
    const available = tracks.filter(track => !assignedIds.has(track.musicKey));

    useEffect(() => setName(playlist.name), [playlist.name]);

    const saveName = async () => {
        if (!name.trim() || name.trim() === playlist.name) {
            setName(playlist.name);
            setRenaming(false);
            return;
        }
        await onRename(name);
        setRenaming(false);
    };

    return (
        <section className="playlist-editor" aria-busy={saving}>
            <header className="playlist-editor-heading">
                {renaming ? (
                    <div className="playlist-name-edit">
                        <input value={name} maxLength={60} onChange={event => setName(event.target.value)} aria-label="歌单名称" />
                        <button type="button" onClick={() => void saveName()} disabled={saving || !name.trim()} aria-label="保存歌单名称"><CheckOutlined /></button>
                        <button type="button" onClick={() => { setName(playlist.name); setRenaming(false); }} aria-label="取消重命名"><CloseOutlined /></button>
                    </div>
                ) : (
                    <div>
                        <h3>{playlist.name}</h3>
                        <p>{playlist.trackIds.length} 首歌曲，调整后立即保存</p>
                    </div>
                )}
                <div className="playlist-heading-actions">
                    {!renaming && <button type="button" onClick={() => setRenaming(true)} aria-label={`重命名${playlist.name}`}><EditOutlined /> 重命名</button>}
                    <Popconfirm
                        title="删除这个歌单？"
                        description="只删除歌单，不会删除任何歌曲文件。"
                        okText="删除"
                        cancelText="取消"
                        onConfirm={onDelete}
                    >
                        <button type="button" className="danger" disabled={saving} aria-label={`删除歌单${playlist.name}`}><DeleteOutlined /> 删除歌单</button>
                    </Popconfirm>
                </div>
            </header>

            <div className="playlist-members-section">
                <h4>歌单内歌曲</h4>
                {assigned.length ? (
                    <div className="playlist-track-rows" role="list" aria-label="歌单内歌曲">
                        {assigned.map((track, index) => (
                            <TrackRow key={track.musicKey} track={track} index={index}>
                                <button type="button" disabled={saving || index === 0} onClick={() => void onTrackIdsChange(moveTrack(playlist.trackIds, index, -1))} aria-label={`上移${track.title}`}><ArrowUpOutlined /></button>
                                <button type="button" disabled={saving || index === assigned.length - 1} onClick={() => void onTrackIdsChange(moveTrack(playlist.trackIds, index, 1))} aria-label={`下移${track.title}`}><ArrowDownOutlined /></button>
                                <button type="button" disabled={saving} onClick={() => void onTrackIdsChange(playlist.trackIds.filter(id => id !== track.musicKey))} aria-label={`从歌单移除${track.title}`}><CloseOutlined /> 移除</button>
                            </TrackRow>
                        ))}
                    </div>
                ) : <p className="playlist-empty">歌单还是空的，可从下方添加歌曲。</p>}
            </div>

            <div className="playlist-members-section available">
                <h4>可添加歌曲</h4>
                {available.length ? (
                    <div className="playlist-track-rows" role="list" aria-label="可添加歌曲">
                        {available.map((track, index) => (
                            <TrackRow key={track.musicKey} track={track} index={index}>
                                <button type="button" disabled={saving} onClick={() => void onTrackIdsChange([...playlist.trackIds, track.musicKey])} aria-label={`添加${track.title}到歌单`}><PlusOutlined /> 添加</button>
                            </TrackRow>
                        ))}
                    </div>
                ) : <p className="playlist-empty">全部歌曲都已加入当前歌单。</p>}
            </div>
        </section>
    );
};

interface TrackRowProps {
    track: MusicTrack;
    index: number;
    children: React.ReactNode;
}

const TrackRow = ({track, index, children}: TrackRowProps) => (
    <div className="playlist-track-row" role="listitem">
        <span className="playlist-track-index">{String(index + 1).padStart(2, '0')}</span>
        <img src={resolveMusicUrl(track.coverUrl)} alt="" />
        <span className="playlist-track-name">
            <strong>{track.title}</strong>
            <small>{track.artist || '未知歌手'}{track.enabled ? '' : ' · 已禁用'}</small>
        </span>
        <span className="playlist-track-actions">{children}</span>
    </div>
);

export default PlaylistEditor;
