import {describe, expect, it} from 'vitest';
import type {AdminTrackDto} from './adminTrack';
import {toMusicTrack} from './adminTrack';

const track: AdminTrackDto = {
    musicKey: 7,
    assetId: '88cf422c-e1b1-43ff-8faf-64bb4aa8cec7',
    title: 'Always Online',
    artist: '林俊杰',
    audioFormat: 'mp3',
    coverPath: 'covers/cover.jpg',
    lyricPath: 'lyrics/song.lrc',
    sortOrder: 1,
    enabled: true,
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: '2026-07-15T00:00:00Z',
};

describe('toMusicTrack', () => {
    it('builds public Media URLs from strict admin object paths', () => {
        const mapped = toMusicTrack(track);

        expect(mapped.coverUrl).toMatch(/^https?:\/\/[^/]+\/covers\/cover\.jpg$/);
        expect(mapped.lyricUrl).toMatch(/^https?:\/\/[^/]+\/lyrics\/song\.lrc$/);
    });

    it('does not invent an image URL when the admin record has no cover', () => {
        expect(toMusicTrack({...track, coverPath: null}).coverUrl).toBe('');
    });
});
