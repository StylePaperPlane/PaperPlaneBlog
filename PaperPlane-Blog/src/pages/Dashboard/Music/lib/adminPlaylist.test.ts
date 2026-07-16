import {describe, expect, it} from 'vitest';
import {moveTrack} from './adminPlaylist';

describe('moveTrack', () => {
    it('moves a track without mutating the source order', () => {
        const source = [1, 2, 3];
        expect(moveTrack(source, 1, -1)).toEqual([2, 1, 3]);
        expect(source).toEqual([1, 2, 3]);
        expect(moveTrack(source, 0, -1)).toBe(source);
    });
});
