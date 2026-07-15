import {describe, expect, it} from 'vitest';
import {InvalidMediaRangeError, parsePlaintextRange} from './range';

describe('parsePlaintextRange', () => {
    it('supports full, open-ended and suffix ranges', () => {
        expect(parsePlaintextRange(null, 100)).toEqual({start: 0, end: 99, partial: false});
        expect(parsePlaintextRange('bytes=20-', 100)).toEqual({start: 20, end: 99, partial: true});
        expect(parsePlaintextRange('bytes=-10', 100)).toEqual({start: 90, end: 99, partial: true});
    });

    it('rejects multi-range and out-of-bounds requests', () => {
        expect(() => parsePlaintextRange('bytes=0-1,4-5', 100)).toThrow(InvalidMediaRangeError);
        expect(() => parsePlaintextRange('bytes=100-101', 100)).toThrow(InvalidMediaRangeError);
    });
});
