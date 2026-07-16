import {describe, expect, it} from 'vitest';
import {shouldContainWheel} from './wheelBoundary';

describe('shouldContainWheel', () => {
    it('contains wheel input when the list cannot scroll or has reached an edge', () => {
        expect(shouldContainWheel({scrollTop: 0, scrollHeight: 100, clientHeight: 100}, 20)).toBe(true);
        expect(shouldContainWheel({scrollTop: 0, scrollHeight: 300, clientHeight: 100}, -20)).toBe(true);
        expect(shouldContainWheel({scrollTop: 200, scrollHeight: 300, clientHeight: 100}, 20)).toBe(true);
    });

    it('keeps normal list scrolling away from the edges', () => {
        expect(shouldContainWheel({scrollTop: 80, scrollHeight: 300, clientHeight: 100}, 20)).toBe(false);
        expect(shouldContainWheel({scrollTop: 80, scrollHeight: 300, clientHeight: 100}, -20)).toBe(false);
    });
});
