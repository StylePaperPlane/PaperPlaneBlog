import {useEffect, useRef, useState} from "react";
import {CustomerServiceOutlined, ReloadOutlined} from "@ant-design/icons";
import {resolveMusicUrl} from "../../../utils/musicUrl";
import {useAudioController} from "../hooks/useAudioController";
import {useLyrics} from "../hooks/useLyrics";
import {useMusicCatalog} from "../hooks/useMusicCatalog";
import {usePlaylistSelection} from "../hooks/usePlaylistSelection";
import {usePlayerPreferences} from "../hooks/usePlayerPreferences";
import type {PlayerContentMode} from "../model/playlist";
import PlayerPanel from "./PlayerPanel";
import {prepareTrackPlayback} from "../../secure-media";
import {useAudioAnalyser} from '../hooks/useAudioAnalyser';
import AudioRhythmGlow from './AudioRhythmGlow';

const MusicPlayer = () => {
    const rootRef = useRef<HTMLElement>(null);
    const [contentMode, setContentMode] = useState<PlayerContentMode>(null);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('isDarkMode') === 'true');
    const {collapsed, setCollapsed, volume, setVolume} = usePlayerPreferences();
    const musicCatalog = useMusicCatalog();
    const playlistSelection = usePlaylistSelection(musicCatalog.catalog);
    const controller = useAudioController({
        playlist: playlistSelection.selected.tracks,
        volume,
        playerRootRef: rootRef,
        prepareSource: prepareTrackPlayback,
    });
    const analyser = useAudioAnalyser(controller.audio);
    const lyrics = useLyrics(controller.currentTrack);

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

    if (musicCatalog.loading) return null;

    if (musicCatalog.failed) {
        return (
            <section ref={rootRef} className={`musicPlayer retry ${isDarkMode ? 'frontDark' : ''}`} data-music-player>
                <button type="button" className="musicRetry" onClick={musicCatalog.reload} aria-label="音乐列表加载失败，点击重试">
                    <ReloadOutlined />
                    <span>音乐加载失败</span>
                </button>
            </section>
        );
    }

    if (!musicCatalog.catalog.tracks.length || !controller.currentTrack) return null;

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
                <div className={`musicPanelFrame ${contentMode ? 'contentExpanded' : ''}`}>
                    <AudioRhythmGlow
                        analyser={analyser}
                        playing={controller.playing}
                        theme={isDarkMode ? 'dark' : 'light'}
                        expanded={Boolean(contentMode)}
                    />
                    <PlayerPanel
                        controller={controller}
                        lyrics={lyrics}
                        contentMode={contentMode}
                        playlists={musicCatalog.catalog.playlists}
                        selectedPlaylistId={playlistSelection.selectedId}
                        playlistTracks={playlistSelection.selected.tracks}
                        volume={volume}
                        onCollapse={() => setCollapsed(true)}
                        onContentModeChange={setContentMode}
                        onPlaylistChange={playlistSelection.selectPlaylist}
                        onVolumeChange={setVolume}
                    />
                </div>
            )}
        </section>
    );
};

export default MusicPlayer;
