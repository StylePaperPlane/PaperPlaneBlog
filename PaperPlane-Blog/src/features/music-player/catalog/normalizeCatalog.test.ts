import {describe, expect, it} from 'vitest';
import {normalizeCatalog} from './normalizeCatalog';

describe('normalizeCatalog', () => {
    it('shuffles the virtual all playlist and preserves custom playlist order', () => {
        const catalog = normalizeCatalog({
            tracks: [
                {musicKey: 1, assetId: '00000000-0000-0000-0000-000000000001', title: '一', artist: '甲', audioFormat: 'mp3', coverUrl: null, lyricUrl: null, plaintextSize: 1, chunkSize: 1, chunkCount: 1, cipherUrl: '/a.ppm'},
                {musicKey: 2, assetId: '00000000-0000-0000-0000-000000000002', title: '二', artist: '乙', audioFormat: 'flac', coverUrl: null, lyricUrl: null, plaintextSize: 1, chunkSize: 1, chunkCount: 1, cipherUrl: '/b.ppm'},
                {musicKey: 3, assetId: '00000000-0000-0000-0000-000000000003', title: '三', artist: '丙', audioFormat: 'mp3', coverUrl: null, lyricUrl: null, plaintextSize: 1, chunkSize: 1, chunkCount: 1, cipherUrl: '/c.ppm'},
            ],
            playlists: [{playlistId: 7, name: '夜间', trackIds: [2, 1, 3]}],
        }, () => 0);

        expect(catalog.playlists[0].id).toBe('all');
        expect(catalog.tracks.map(track => track.musicKey)).toEqual([1, 2, 3]);
        expect(catalog.playlists[0].tracks.map(track => track.musicKey)).toEqual([2, 3, 1]);
        expect(catalog.playlists[1].tracks.map(track => track.musicKey)).toEqual([2, 1, 3]);
    });
});
