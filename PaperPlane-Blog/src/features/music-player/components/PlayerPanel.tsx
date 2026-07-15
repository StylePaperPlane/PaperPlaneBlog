import {useEffect, useMemo, useRef} from "react";
import {
    CaretRightOutlined,
    CompressOutlined,
    PauseOutlined,
    StepBackwardOutlined,
    StepForwardOutlined,
    UnorderedListOutlined
} from "@ant-design/icons";
import {resolveMusicUrl} from "../../../utils/musicUrl";
import {findActiveLyricIndex, formatTime} from "../lib/lyricParser";
import type {AudioController, LyricLine} from "../model/types";

interface PlayerPanelProps {
    controller: AudioController;
    lyrics: LyricLine[];
    showLyrics: boolean;
    volume: number;
    onCollapse: () => void;
    onToggleLyrics: () => void;
    onVolumeChange: (value: number) => void;
}

const PlayerPanel = ({
    controller,
    lyrics,
    showLyrics,
    volume,
    onCollapse,
    onToggleLyrics,
    onVolumeChange
}: PlayerPanelProps) => {
    const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
    const lyricLineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
    const activeLyricIndex = useMemo(
        () => findActiveLyricIndex(lyrics, controller.currentTime),
        [controller.currentTime, lyrics]
    );
    const progress = controller.duration > 0 ? controller.currentTime / controller.duration * 100 : 0;

    useEffect(() => {
        lyricLineRefs.current = lyricLineRefs.current.slice(0, lyrics.length);
    }, [lyrics]);

    useEffect(() => {
        if (!showLyrics || activeLyricIndex < 0) return;
        const container = lyricsContainerRef.current;
        const activeLine = lyricLineRefs.current[activeLyricIndex];
        if (!container || !activeLine) return;

        const containerRect = container.getBoundingClientRect();
        const lineRect = activeLine.getBoundingClientRect();
        const targetTop = container.scrollTop + lineRect.top - containerRect.top
            - container.clientHeight / 2 + lineRect.height / 2;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        container.scrollTo({top: Math.max(0, targetTop), behavior: reducedMotion ? 'auto' : 'smooth'});
    }, [activeLyricIndex, showLyrics]);

    const track = controller.currentTrack;
    if (!track) return null;

    return (
        <div className="musicPanel">
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
                <button
                    type="button"
                    className={showLyrics ? 'active' : ''}
                    onClick={onToggleLyrics}
                    aria-label={showLyrics ? '隐藏歌词' : '显示歌词'}
                    aria-pressed={showLyrics}
                    title={showLyrics ? '隐藏歌词' : '显示歌词'}
                >
                    <UnorderedListOutlined />
                </button>
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
            {showLyrics && (
                <div className="musicLyrics" ref={lyricsContainerRef} aria-label={`${track.title} 歌词`}>
                    {lyrics.length ? lyrics.map((line, index) => (
                        <p
                            key={`${line.time}-${line.text}-${index}`}
                            ref={node => { lyricLineRefs.current[index] = node; }}
                            className={index === activeLyricIndex ? 'active' : ''}
                            aria-current={index === activeLyricIndex ? 'true' : undefined}
                        >
                            {line.text}
                        </p>
                    )) : <p className="empty">暂无歌词</p>}
                </div>
            )}
        </div>
    );
};

export default PlayerPanel;
