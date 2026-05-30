import './index.sass';
import {useEffect, useMemo, useRef, useState} from "react";
import {CaretRightOutlined, CustomerServiceOutlined, PauseOutlined, StepBackwardOutlined, StepForwardOutlined, UnorderedListOutlined} from "@ant-design/icons";
import {getPublicMusicList} from "../../apis/MusicMethods";
import {MusicTrack} from "../../interface/MusicType";
import {resolveMusicUrl} from "../../utils/musicUrl";

interface LyricLine {
    time: number;
    text: string;
}

const STORAGE_KEYS = {
    collapsed: 'musicPlayerCollapsed',
    volume: 'musicPlayerVolume',
    currentIndex: 'musicPlayerCurrentIndex'
};

const FALLBACK_TRACKS: MusicTrack[] = [];

const parseLyrics = (content: string): LyricLine[] => {
    return content
        .split(/\r?\n/)
        .flatMap(line => {
            const matches = [...line.matchAll(/\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g)];
            const text = line.replace(/\[[^\]]+\]/g, '').trim();
            if (!matches.length || !text) return [];
            return matches.map(match => ({
                time: Number(match[1]) * 60 + Number(match[2]) + Number(`0.${match[3] || '0'}`),
                text
            }));
        })
        .sort((a, b) => a.time - b.time);
};

const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return '00:00';
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const MusicPlayer = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
    const lyricLineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
    const interactionBoundRef = useRef(false);
    const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
    const [currentIndex, setCurrentIndex] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.currentIndex) || 0));
    const [playing, setPlaying] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEYS.collapsed) === 'true');
    const [showLyrics, setShowLyrics] = useState(false);
    const [volume, setVolume] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.volume) || 0.72));
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('isDarkMode') === 'true');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);

    const currentTrack = playlist[currentIndex];
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const activeLyricIndex = useMemo(() => {
        if (!lyrics.length) return -1;
        return lyrics.findIndex((line, index) => currentTime >= line.time && (!lyrics[index + 1] || currentTime < lyrics[index + 1].time));
    }, [currentTime, lyrics]);

    useEffect(() => {
        getPublicMusicList().then(res => {
            const tracks = ((res.data.data || []) as MusicTrack[]).filter(track => track.enabled);
            const nextTracks = tracks.length ? tracks : FALLBACK_TRACKS;
            setPlaylist(nextTracks);
            if (nextTracks.length && currentIndex >= nextTracks.length) {
                setCurrentIndex(0);
            }
        }).catch(() => {
            setPlaylist(FALLBACK_TRACKS);
            if (currentIndex >= FALLBACK_TRACKS.length) {
                setCurrentIndex(0);
            }
        });
    }, []);

    useEffect(() => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.volume = volume;
        audioRef.current = audio;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDuration = () => setDuration(audio.duration || 0);
        const handleEnded = () => setCurrentIndex(prev => playlist.length ? (prev + 1) % playlist.length : 0);
        const handlePlay = () => setPlaying(true);
        const handlePause = () => setPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.pause();
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, [playlist.length]);

    useEffect(() => {
        if (!currentTrack || !audioRef.current) return;
        audioRef.current.src = resolveMusicUrl(currentTrack.audioUrl);
        audioRef.current.load();
        setCurrentTime(0);
        setDuration(0);
        localStorage.setItem(STORAGE_KEYS.currentIndex, String(currentIndex));
        tryPlay();
        fetch(resolveMusicUrl(currentTrack.lyricUrl))
            .then(res => res.ok ? res.text() : '')
            .then(text => setLyrics(parseLyrics(text)))
            .catch(() => setLyrics([]));
    }, [currentIndex, currentTrack?.audioUrl]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
        localStorage.setItem(STORAGE_KEYS.volume, String(volume));
    }, [volume]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.collapsed, String(collapsed));
    }, [collapsed]);

    useEffect(() => {
        const syncTheme = () => setIsDarkMode(localStorage.getItem('isDarkMode') === 'true');
        const handleThemeChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ isDarkMode: boolean }>;
            setIsDarkMode(Boolean(customEvent.detail?.isDarkMode));
        };

        window.addEventListener('storage', syncTheme);
        window.addEventListener('theme-mode-change', handleThemeChange);
        return () => {
            window.removeEventListener('storage', syncTheme);
            window.removeEventListener('theme-mode-change', handleThemeChange);
        };
    }, []);

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
        const targetTop = container.scrollTop
            + (lineRect.top - containerRect.top)
            - (container.clientHeight / 2)
            + (lineRect.height / 2);
        container.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth'
        });
    }, [activeLyricIndex, showLyrics]);

    const bindFirstInteraction = () => {
        if (interactionBoundRef.current) return;
        interactionBoundRef.current = true;
        const resume = () => {
            setBlocked(false);
            tryPlay();
            window.removeEventListener('pointerdown', resume);
            window.removeEventListener('keydown', resume);
        };
        window.addEventListener('pointerdown', resume, {once: true});
        window.addEventListener('keydown', resume, {once: true});
    };

    const tryPlay = () => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;
        audio.play().then(() => {
            setBlocked(false);
            setPlaying(true);
        }).catch(() => {
            setBlocked(true);
            setPlaying(false);
            bindFirstInteraction();
        });
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;
        if (audio.paused) {
            tryPlay();
        } else {
            audio.pause();
        }
    };

    const next = () => setCurrentIndex(prev => playlist.length ? (prev + 1) % playlist.length : 0);
    const previous = () => setCurrentIndex(prev => playlist.length ? (prev - 1 + playlist.length) % playlist.length : 0);

    const seek = (value: number) => {
        if (!audioRef.current || !duration) return;
        audioRef.current.currentTime = (value / 100) * duration;
    };

    if (!playlist.length || !currentTrack) {
        return null;
    }

    return (
        <section className={`musicPlayer ${isDarkMode ? 'frontDark' : ''} ${collapsed ? 'collapsed' : ''}`}>
            <button className="musicCollapse" type="button" onClick={() => setCollapsed(!collapsed)}>
                <img src={resolveMusicUrl(currentTrack.coverUrl)} alt={currentTrack.title} />
                <span className="musicCollapseIcon"><CustomerServiceOutlined /></span>
            </button>
            {!collapsed && (
                <div className="musicPanel">
                    <div className="musicHeader">
                        <img className={`musicCover ${playing ? 'spinning' : ''}`} src={resolveMusicUrl(currentTrack.coverUrl)} alt={currentTrack.title} />
                        <div className="musicMeta">
                            <strong>{currentTrack.title}</strong>
                            <span>{currentTrack.artist || 'Unknown Artist'}</span>
                            {blocked && <em>点击页面后开始播放</em>}
                        </div>
                    </div>
                    <div className="musicProgress">
                        <span>{formatTime(currentTime)}</span>
                        <input type="range" min={0} max={100} value={progress || 0} onChange={event => seek(Number(event.target.value))} />
                        <span>{formatTime(duration)}</span>
                    </div>
                    <div className="musicControls">
                        <button type="button" onClick={previous}><StepBackwardOutlined /></button>
                        <button type="button" className="playButton" onClick={togglePlay}>
                            {playing ? <PauseOutlined /> : <CaretRightOutlined />}
                        </button>
                        <button type="button" onClick={next}><StepForwardOutlined /></button>
                        <button type="button" className={showLyrics ? 'active' : ''} onClick={() => setShowLyrics(!showLyrics)}><UnorderedListOutlined /></button>
                        <input className="volume" type="range" min={0} max={1} step={0.01} value={volume} onChange={event => setVolume(Number(event.target.value))} />
                    </div>
                    {showLyrics && (
                        <div className="musicLyrics" ref={lyricsContainerRef}>
                            {lyrics.length ? lyrics.map((line, index) => (
                                <p
                                    key={`${line.time}-${line.text}`}
                                    ref={node => {
                                        lyricLineRefs.current[index] = node;
                                    }}
                                    className={index === activeLyricIndex ? 'active' : ''}
                                >
                                    {line.text}
                                </p>
                            )) : <p className="empty">暂无歌词</p>}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default MusicPlayer;
