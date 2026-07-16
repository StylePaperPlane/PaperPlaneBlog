import {act, renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';
import type {MusicCatalog} from '../model/playlist';
import {usePlaylistSelection} from './usePlaylistSelection';

const catalog: MusicCatalog = {
    tracks: [],
    playlists: [
        {id: 'all', name: '全部歌曲', tracks: [{musicKey: 1, title: '一', audioFormat: 'mp3', coverUrl: '', lyricUrl: '', sortOrder: 0, enabled: true}]},
        {id: 8, name: '夜间', tracks: [{musicKey: 1, title: '一', audioFormat: 'mp3', coverUrl: '', lyricUrl: '', sortOrder: 0, enabled: true}]},
    ],
};

describe('usePlaylistSelection', () => {
    beforeEach(() => localStorage.clear());

    it('persists a valid playlist and falls back when it disappears', () => {
        const {result, rerender} = renderHook(({value}) => usePlaylistSelection(value), {initialProps: {value: catalog}});
        act(() => result.current.selectPlaylist(8));
        expect(result.current.selectedId).toBe(8);
        expect(localStorage.getItem('musicPlayerPlaylist')).toBe('8');

        rerender({value: {...catalog, playlists: [catalog.playlists[0]]}});
        expect(result.current.selectedId).toBe('all');
    });
});
