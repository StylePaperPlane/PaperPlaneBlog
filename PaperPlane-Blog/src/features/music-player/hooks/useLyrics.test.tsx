import {act, renderHook, waitFor} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import type {MusicTrack} from '../../../interface/MusicType';
import {useLyrics} from './useLyrics';

const makeTrack = (musicKey: number, lyricUrl: string): MusicTrack => ({
    musicKey,
    title: `歌曲 ${musicKey}`,
    audioFormat: 'mp3',
    audioUrl: '',
    coverUrl: '',
    lyricUrl,
    sortOrder: musicKey,
    enabled: true
});

describe('useLyrics', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('aborts the previous lyric request when the track changes', async () => {
        const signals: AbortSignal[] = [];
        const fetchMock = vi.fn((_: RequestInfo | URL, init?: RequestInit) => {
            if (init?.signal) signals.push(init.signal);
            const content = signals.length === 1 ? '[00:01]旧歌词' : '[00:01]新歌词';
            return Promise.resolve(new Response(content, {status: 200}));
        });
        vi.stubGlobal('fetch', fetchMock);

        const {result, rerender} = renderHook(({track}) => useLyrics(track), {
            initialProps: {track: makeTrack(1, '/one.lrc')}
        });
        rerender({track: makeTrack(2, '/two.lrc')});

        expect(signals[0].aborted).toBe(true);
        await act(async () => undefined);
        await waitFor(() => expect(result.current[0]?.text).toBe('新歌词'));
    });
});
