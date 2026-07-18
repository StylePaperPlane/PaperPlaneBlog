import {
    CaretRightOutlined,
    CompressOutlined,
    FileTextOutlined,
    PauseOutlined,
    StepBackwardOutlined,
    StepForwardOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons';
import type {MusicTrack} from '../../../interface/MusicType';
import {resolveMusicUrl} from '../../../utils/musicUrl';
import {formatTime} from '../lib/lyricParser';
import type {PlayerContentMode, PlayerPlaylist, PlayerPlaylistId} from '../model/playlist';
import type {AudioController, LyricLine} from '../model/types';
import ModeToggleButton from './ModeToggleButton';
import PlayerContent from './PlayerContent';

interface PlayerPanelProps {
    controller: AudioController;
    lyrics: LyricLine[];
    contentMode: PlayerContentMode;
    playlists: PlayerPlaylist[];
    selectedPlaylistId: PlayerPlaylistId;
    playlistTracks: MusicTrack[];
    volume: number;
    onCollapse: () => void;
    onContentModeChange: (mode: PlayerContentMode) => void;
    onPlaylistChange: (id: PlayerPlaylistId) => void;
    onVolumeChange: (value: number) => void;
}

const PlayerPanel = ({
    controller,
    lyrics,
    contentMode,
    playlists,
    selectedPlaylistId,
    playlistTracks,
    volume,
    onCollapse,
    onContentModeChange,
    onPlaylistChange,
    onVolumeChange,
}: PlayerPanelProps) => {
    const track = controller.currentTrack;
    if (!track) return null;
    const progress = controller.duration > 0 ? controller.currentTime / controller.duration * 100 : 0;
    const toggleMode = (mode: Exclude<PlayerContentMode, null>) => {
        onContentModeChange(contentMode === mode ? null : mode);
    };

    return (
        <div className={`musicPanel ${contentMode ? 'contentExpanded' : ''}`}>
            <div className="musicHeader">
                <img
                    className={`musicCover ${controller.playing ? 'spinning' : ''}`}
                    src={resolveMusicUrl(track.coverUrl)}
                    alt=""
                />
                <div className="musicMeta">
                    <strong>{track.title}</strong>
                    <span>{track.artist || '未知歌手'}</span>
                    {controller.notice && (
                        <em className={controller.notice.kind} role="status" aria-live="polite">
                            {controller.notice.text}
                        </em>
                    )}
                </div>
                <button className="panelCollapse" type="button" onClick={onCollapse} aria-label="收起音乐播放器" title="收起播放器">
                    <CompressOutlined />
                </button>
            </div>
            <div className="musicProgress">
                <span>{formatTime(controller.currentTime)}</span>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress || 0}
                    onChange={event => controller.seek(Number(event.target.value))}
                    aria-label="播放进度"
                    aria-valuetext={`${formatTime(controller.currentTime)} / ${formatTime(controller.duration)}`}
                />
                <span>{formatTime(controller.duration)}</span>
            </div>
            <div className="musicControls">
                <button type="button" onClick={controller.previous} aria-label="播放上一首" title="上一首"><StepBackwardOutlined /></button>
                <button
                    type="button"
                    className="playButton"
                    onClick={controller.togglePlay}
                    aria-label={controller.playing ? `暂停 ${track.title}` : `播放 ${track.title}`}
                    title={controller.playing ? '暂停' : '播放'}
                >
                    {controller.playing ? <PauseOutlined /> : <CaretRightOutlined />}
                </button>
                <button type="button" onClick={controller.next} aria-label="播放下一首" title="下一首"><StepForwardOutlined /></button>
                <ModeToggleButton
                    active={contentMode === 'lyrics'}
                    onClick={() => toggleMode('lyrics')}
                    label={contentMode === 'lyrics' ? '隐藏歌词' : '显示歌词'}
                    title="歌词"
                    rotation={-3}
                >
                    <FileTextOutlined />
                </ModeToggleButton>
                <ModeToggleButton
                    active={contentMode === 'playlist'}
                    onClick={() => toggleMode('playlist')}
                    label={contentMode === 'playlist' ? '隐藏当前歌单' : '显示当前歌单'}
                    title="歌单"
                    rotation={3}
                >
                    <UnorderedListOutlined />
                </ModeToggleButton>
                <input
                    className="volume"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={event => onVolumeChange(Number(event.target.value))}
                    aria-label="播放音量"
                    aria-valuetext={`${Math.round(volume * 100)}%`}
                />
            </div>
            <PlayerContent
                mode={contentMode}
                currentTrack={track}
                currentTime={controller.currentTime}
                lyrics={lyrics}
                playlists={playlists}
                selectedPlaylistId={selectedPlaylistId}
                tracks={playlistTracks}
                onSelectPlaylist={onPlaylistChange}
                onSelectTrack={controller.selectTrack}
            />
        </div>
    );
};

export default PlayerPanel;
