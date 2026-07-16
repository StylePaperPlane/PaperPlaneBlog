import {describe, expect, it} from 'vitest';
import {normalizeCatalog} from './normalizeCatalog';

describe('normalizeCatalog', () => {
    it('builds the virtual all playlist and preserves playlist order', () => {
        const catalog = normalizeCatalog({
            tracks: [
                {musicKey: 1, assetId: '00000000-0000-0000-0000-000000000001', title: '一', artist: '甲', audioFormat: 'mp3', coverUrl: null, lyricUrl: null, plaintextSize: 1, chunkSize: 1, chunkCount: 1, cipherUrl: '/a.ppm'},
                {musicKey: 2, assetId: '00000000-0000-0000-0000-000000000002', title: '二', artist: '乙', audioFormat: 'flac', coverUrl: null, lyricUrl: null, plaintextSize: 1, chunkSize: 1, chunkCount: 1, cipherUrl: '/b.ppm'},
            ],
            playlists: [{playlistId: 7, name: '夜间', trackIds: [2, 1]}],
        });

        expect(catalog.playlists[0].id).toBe('all');
        expect(catalog.playlists[1].tracks.map(track => track.musicKey)).toEqual([2, 1]);
    });
});
