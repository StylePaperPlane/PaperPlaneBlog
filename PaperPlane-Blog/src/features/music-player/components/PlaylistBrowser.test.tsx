import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import type {PlayerPlaylist} from '../model/playlist';
import PlaylistBrowser from './PlaylistBrowser';

const track = {musicKey: 1, title: '第一首', artist: '歌手', audioFormat: 'mp3' as const, coverUrl: '', lyricUrl: '', sortOrder: 0, enabled: true};
const playlists: PlayerPlaylist[] = [
    {id: 'all', name: '全部歌曲', tracks: [track]},
    {id: 3, name: '夜间', tracks: [track]},
];

describe('PlaylistBrowser', () => {
    it('selects playlists and exposes the current track in Chinese', () => {
        const selectPlaylist = vi.fn();
        const selectTrack = vi.fn();
        render(
            <PlaylistBrowser
                playlists={playlists}
                selectedId="all"
                tracks={[track]}
                currentTrack={track}
                onSelectPlaylist={selectPlaylist}
                onSelectTrack={selectTrack}
            />,
        );

        fireEvent.click(screen.getByLabelText('当前歌曲，第一首，歌手'));
        expect(selectTrack).toHaveBeenCalledWith(1);
        fireEvent.click(screen.getByLabelText('选择歌单，当前为全部歌曲'));
        fireEvent.click(screen.getByRole('option', {name: /夜间/}));
        expect(selectPlaylist).toHaveBeenCalledWith(3);
    });
});
