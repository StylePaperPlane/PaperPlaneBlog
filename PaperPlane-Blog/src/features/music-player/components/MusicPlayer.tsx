import {useCallback, useEffect, useRef, useState} from "react";
import {CustomerServiceOutlined, ReloadOutlined} from "@ant-design/icons";
import {getPublicMusicList} from "../../../apis/MusicMethods";
import type {MusicTrack} from "../../../interface/MusicType";
import {resolveMusicUrl} from "../../../utils/musicUrl";
import {useAudioController} from "../hooks/useAudioController";
import {useLyrics} from "../hooks/useLyrics";
import {usePlayerPreferences} from "../hooks/usePlayerPreferences";
import PlayerPanel from "./PlayerPanel";
import {prepareTrackPlayback} from "../../secure-media";

const MusicPlayer = () => {
    const rootRef = useRef<HTMLElement>(null);
    const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [showLyrics, setShowLyrics] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('isDarkMode') === 'true');
    const {collapsed, setCollapsed, volume, setVolume} = usePlayerPreferences();
    const controller = useAudioController({
        playlist,
        volume,
        playerRootRef: rootRef,
        prepareSource: prepareTrackPlayback,
    });
    const lyrics = useLyrics(controller.currentTrack);

    const loadPlaylist = useCallback(() => {
        setLoading(true);
        setLoadFailed(false);
        getPublicMusicList()
            .then(response => {
                const tracks = ((response.data.data || []) as MusicTrack[]).map(track => ({
                    ...track,
                    enabled: true,
                }));
                setPlaylist(tracks);
            })
            .catch(error => {
                if (import.meta.env.DEV) console.error('安全音乐初始化失败', error);
                setPlaylist([]);
                setLoadFailed(true);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(loadPlaylist, [loadPlaylist]);

    useEffect(() => {
        const syncTheme = () => setIsDarkMode(localStorage.getItem('isDarkMode') === 'true');
        const handleThemeChange = (event: Event) => {
            const customEvent = event as CustomEvent<{isDarkMode: boolean}>;
            setIsDarkMode(Boolean(customEvent.detail?.isDarkMode));
        };
        window.addEventListener('storage', syncTheme);
        window.addEventListener('theme-mode-change', handleThemeChange);
        return () => {
            window.removeEventListener('storage', syncTheme);
            window.removeEventListener('theme-mode-change', handleThemeChange);
        };
    }, []);

    if (loading) return null;

    if (loadFailed) {
        return (
            <section ref={rootRef} className={`musicPlayer retry ${isDarkMode ? 'frontDark' : ''}`} data-music-player>
                <button type="button" className="musicRetry" onClick={loadPlaylist} aria-label="音乐列表加载失败，点击重试">
                    <ReloadOutlined />
                    <span>音乐加载失败</span>
                </button>
            </section>
        );
    }

    if (!playlist.length || !controller.currentTrack) return null;

    return (
        <section
            ref={rootRef}
            className={`musicPlayer ${isDarkMode ? 'frontDark' : ''} ${collapsed ? 'collapsed' : ''}`}
            data-music-player
        >
            <button
                className="musicCollapse"
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? '展开音乐播放器' : '收起音乐播放器'}
                title={collapsed ? '展开播放器' : '收起播放器'}
            >
                <img src={resolveMusicUrl(controller.currentTrack.coverUrl)} alt="" />
                <span className="musicCollapseIcon" aria-hidden="true"><CustomerServiceOutlined /></span>
            </button>
            {!collapsed && (
                <PlayerPanel
                    controller={controller}
                    lyrics={lyrics}
                    showLyrics={showLyrics}
                    volume={volume}
                    onCollapse={() => setCollapsed(true)}
                    onToggleLyrics={() => setShowLyrics(value => !value)}
                    onVolumeChange={setVolume}
                />
            )}
        </section>
    );
};

export default MusicPlayer;
