import {describe, expect, it} from 'vitest';
import {findActiveLyricIndex, formatTime, parseLyrics} from './lyricParser';

describe('lyricParser', () => {
    it('parses multiple timestamps and sorts the result', () => {
        const lyrics = parseLyrics('[00:03.50][00:05.5]第二句\n[00:01.25]第一句\n[ar:歌手]');

        expect(lyrics).toEqual([
            {time: 1.25, text: '第一句'},
            {time: 3.5, text: '第二句'},
            {time: 5.5, text: '第二句'}
        ]);
    });

    it('finds the active line and formats invalid time safely', () => {
        const lyrics = [{time: 1, text: 'A'}, {time: 3, text: 'B'}];
        expect(findActiveLyricIndex(lyrics, 2)).toBe(0);
        expect(findActiveLyricIndex(lyrics, 3)).toBe(1);
        expect(formatTime(Number.NaN)).toBe('00:00');
        expect(formatTime(65.9)).toBe('01:05');
    });
});
