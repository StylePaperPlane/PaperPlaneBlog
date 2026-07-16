import {describe, expect, it} from 'vitest';
import {shuffleCopy} from './shuffle';

describe('shuffleCopy', () => {
    it('uses Fisher-Yates without mutating the source list', () => {
        const source = [1, 2, 3, 4];

        const shuffled = shuffleCopy(source, () => 0);

        expect(source).toEqual([1, 2, 3, 4]);
        expect(shuffled).toEqual([2, 3, 4, 1]);
    });
});
