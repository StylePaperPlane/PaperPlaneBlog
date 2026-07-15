import {describe, expect, it} from 'vitest';
import {cipherChunkRange} from './chunkRange';

describe('PPM1 ciphertext chunk mapping', () => {
    it('accounts for the fixed header and one authentication tag per chunk', () => {
        expect(cipherChunkRange(0, 262144, 300000)).toEqual({start: 64, end: 262223});
        expect(cipherChunkRange(1, 262144, 300000)).toEqual({start: 262224, end: 300095});
    });
});
