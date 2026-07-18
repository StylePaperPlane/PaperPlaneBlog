import {describe, expect, it} from 'vitest';
import {getGlowPresentation} from './glowPresentation';

describe('getGlowPresentation', () => {
    it('makes the expanded player materially larger and brighter', () => {
        const compact = getGlowPresentation(false);
        const expanded = getGlowPresentation(true);

        expect(expanded.outerScale).toBeGreaterThan(compact.outerScale * 1.2);
        expect(expanded.innerScale).toBeGreaterThan(compact.innerScale * 1.2);
        expect(expanded.outerOpacity).toBeGreaterThan(compact.outerOpacity);
        expect(expanded.innerOpacity).toBeGreaterThan(compact.innerOpacity);
    });
});
