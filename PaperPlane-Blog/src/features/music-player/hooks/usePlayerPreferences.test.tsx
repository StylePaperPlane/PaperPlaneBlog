import {act, renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {usePlayerPreferences} from './usePlayerPreferences';

describe('usePlayerPreferences', () => {
    beforeEach(() => localStorage.clear());

    it('defaults to collapsed on mobile and clamps persisted volume', () => {
        vi.mocked(window.matchMedia).mockImplementation(query => ({
            matches: query.includes('max-width'),
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn()
        }));
        localStorage.setItem('musicPlayerVolume', '3');

        const {result} = renderHook(() => usePlayerPreferences());
        expect(result.current.collapsed).toBe(true);
        expect(result.current.volume).toBe(1);

        act(() => result.current.setVolume(-1));
        expect(result.current.volume).toBe(0);
    });
});
