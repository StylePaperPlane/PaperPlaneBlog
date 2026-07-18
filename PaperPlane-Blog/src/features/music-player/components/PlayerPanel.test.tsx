import {fireEvent, render, screen} from '@testing-library/react';
import {beforeAll, describe, expect, it, vi} from 'vitest';
import type {MusicTrack} from '../../../interface/MusicType';
import type {AudioController} from '../model/types';
import PlayerPanel from './PlayerPanel';

const track: MusicTrack = {
    musicKey: 1,
    title: '测试歌曲',
    artist: '测试歌手',
    audioFormat: 'mp3',
    audioUrl: '/music/test.mp3',
    coverUrl: '',
    lyricUrl: '',
    sortOrder: 0,
    enabled: true,
};

const controller: AudioController = {
    audio: {getElement: () => null},
    currentTrack: track,
    currentIndex: 0,
    playing: false,
    currentTime: 0,
    duration: 180,
    notice: null,
    togglePlay: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    selectTrack: vi.fn(),
    seek: vi.fn(),
};

const defaultProps = {
    controller,
    lyrics: [],
    playlists: [{id: 'all' as const, name: '全部歌曲', tracks: [track]}],
    selectedPlaylistId: 'all' as const,
    playlistTracks: [track],
    volume: 0.7,
    onCollapse: vi.fn(),
    onContentModeChange: vi.fn(),
    onPlaylistChange: vi.fn(),
    onVolumeChange: vi.fn(),
};

beforeAll(() => {
    Object.defineProperty(window, 'scrollTo', {
        configurable: true,
        value: vi.fn(),
    });
});

describe('PlayerPanel content controls', () => {
    it('keeps lyrics and playlist modes mutually exclusive with Chinese labels', () => {
        const onContentModeChange = vi.fn();
        const {rerender} = render(
            <PlayerPanel {...defaultProps} contentMode={null} onContentModeChange={onContentModeChange} />,
        );

        fireEvent.click(screen.getByRole('button', {name: '显示歌词'}));
        expect(onContentModeChange).toHaveBeenLastCalledWith('lyrics');
        fireEvent.click(screen.getByRole('button', {name: '显示当前歌单'}));
        expect(onContentModeChange).toHaveBeenLastCalledWith('playlist');

        rerender(
            <PlayerPanel {...defaultProps} contentMode="lyrics" onContentModeChange={onContentModeChange} />,
        );
        const lyricsButton = screen.getByRole('button', {name: '隐藏歌词'});
        expect(lyricsButton).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(lyricsButton);
        expect(onContentModeChange).toHaveBeenLastCalledWith(null);
    });
});
