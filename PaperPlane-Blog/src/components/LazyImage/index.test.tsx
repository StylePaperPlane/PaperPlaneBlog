import {act, cleanup, render} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import LazyImage from './index';

let intersectionCallback: IntersectionObserverCallback;
let intersectionOptions: IntersectionObserverInit | undefined;
const observe = vi.fn();
const unobserve = vi.fn();

beforeEach(() => {
    observe.mockClear();
    unobserve.mockClear();
    vi.stubGlobal('IntersectionObserver', vi.fn((callback: IntersectionObserverCallback, options?: IntersectionObserverInit) => {
        intersectionCallback = callback;
        intersectionOptions = options;
        return {
            observe,
            unobserve,
            disconnect: vi.fn(),
            takeRecords: vi.fn(() => []),
            root: null,
            rootMargin: options?.rootMargin ?? '0px',
            thresholds: [0.01],
        };
    }));
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

describe('LazyImage', () => {
    it('starts loading before entering the viewport', () => {
        const {container} = render(<LazyImage src="https://media.example/cover.webp" />);
        const shell = container.querySelector('.lazy-image-shell');

        expect(intersectionOptions).toMatchObject({rootMargin: '320px 0px', threshold: 0.01});
        expect(container.querySelector('img')).toBeNull();

        act(() => {
            intersectionCallback([
                {isIntersecting: true, target: shell} as unknown as IntersectionObserverEntry,
            ], {} as IntersectionObserver);
        });

        const image = container.querySelector('img');
        expect(image).toHaveAttribute('src', 'https://media.example/cover.webp');
        expect(image).toHaveAttribute('loading', 'eager');
        expect(image).toHaveAttribute('decoding', 'async');
        expect(unobserve).toHaveBeenCalledWith(shell);
    });
});
