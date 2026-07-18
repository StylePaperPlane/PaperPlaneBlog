import {act, renderHook, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {MusicTrack} from '../../../interface/MusicType';
import {AudioSourceError} from '../model/types';
import {useAudioController} from './useAudioController';

class MockAudio extends EventTarget {
    static instances: MockAudio[] = [];
    preload = '';
    volume = 1;
    currentTime = 0;
    duration = 180;
    src = '';
    paused = true;
    error: MediaError | null = null;
    play = vi.fn(async () => {
        this.paused = false;
        this.dispatchEvent(new Event('play'));
    });
    pause = vi.fn(() => {
        this.paused = true;
        this.dispatchEvent(new Event('pause'));
    });
    load = vi.fn();
    removeAttribute = vi.fn((name: string) => {
        if (name === 'src') this.src = '';
    });

    constructor() {
        super();
        MockAudio.instances.push(this);
    }
}

const tracks: MusicTrack[] = [
    {musicKey: 1, title: '第一首', audioFormat: 'mp3', audioUrl: '/music/one.mp3', coverUrl: '', lyricUrl: '', sortOrder: 1, enabled: true},
    {musicKey: 2, title: '第二首', audioFormat: 'flac', audioUrl: '/music/two.flac', coverUrl: '', lyricUrl: '', sortOrder: 2, enabled: true}
];

describe('useAudioController', () => {
    beforeEach(() => {
        MockAudio.instances = [];
        vi.stubGlobal('Audio', MockAudio);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        document.body.innerHTML = '';
    });

    it('keeps one Audio instance when volume changes', () => {
        const player = document.createElement('section');
        const playerRootRef = {current: player};
        const {result, rerender} = renderHook(
            ({volume}) => useAudioController({playlist: tracks, volume, playerRootRef}),
            {initialProps: {volume: 0.72}}
        );

        expect(MockAudio.instances).toHaveLength(1);
        expect(result.current.audio.getElement()).toBe(MockAudio.instances[0]);
        rerender({volume: 0.35});
        expect(MockAudio.instances).toHaveLength(1);
        expect(result.current.audio.getElement()).toBe(MockAudio.instances[0]);
        expect(MockAudio.instances[0].volume).toBe(0.35);
    });

    it('starts once from the first outside pointer interaction without racing player controls', async () => {
        const player = document.createElement('section');
        const playerButton = document.createElement('button');
        player.appendChild(playerButton);
        document.body.append(player, document.createElement('main'));
        const playerRootRef = {current: player};
        renderHook(() => useAudioController({playlist: tracks, volume: 0.72, playerRootRef}));
        const audio = MockAudio.instances[0];

        act(() => playerButton.dispatchEvent(new Event('pointerdown', {bubbles: true})));
        expect(audio.play).not.toHaveBeenCalled();

        act(() => document.querySelector('main')?.dispatchEvent(new Event('pointerdown', {bubbles: true})));
        await waitFor(() => expect(audio.play).toHaveBeenCalledTimes(1));

        act(() => document.body.dispatchEvent(new Event('pointerdown', {bubbles: true})));
        expect(audio.play).toHaveBeenCalledTimes(1);
    });

    it('does not request or decrypt the media stream before playback is requested', async () => {
        const player = document.createElement('section');
        const article = document.createElement('main');
        document.body.append(player, article);
        const prepareSource = vi.fn(async () => ({url: 'blob:encrypted-stream', release: vi.fn()}));

        renderHook(() => useAudioController({
            playlist: tracks,
            volume: 0.72,
            playerRootRef: {current: player},
            prepareSource,
        }));

        expect(prepareSource).not.toHaveBeenCalled();
        act(() => article.dispatchEvent(new Event('pointerdown', {bubbles: true})));
        await waitFor(() => expect(prepareSource).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(MockAudio.instances[0].play).toHaveBeenCalledTimes(1));
    });

    it('keeps stream preparation silent while the encrypted source is pending', async () => {
        const player = document.createElement('section');
        const article = document.createElement('main');
        document.body.append(player, article);
        const prepareSource = vi.fn(() => new Promise<never>(() => undefined));
        const {result} = renderHook(() => useAudioController({
            playlist: tracks,
            volume: 0.72,
            playerRootRef: {current: player},
            prepareSource,
        }));

        act(() => article.dispatchEvent(new Event('pointerdown', {bubbles: true})));

        await waitFor(() => expect(prepareSource).toHaveBeenCalledTimes(1));
        expect(result.current.notice).toBeNull();
    });

    it('skips failed tracks once and stops after the whole playlist fails', async () => {
        const playerRootRef = {current: document.createElement('section')};
        const {result} = renderHook(() => useAudioController({playlist: tracks, volume: 0.72, playerRootRef}));
        const audio = MockAudio.instances[0];

        act(() => document.body.dispatchEvent(new Event('pointerdown', {bubbles: true})));
        await waitFor(() => expect(audio.play).toHaveBeenCalled());

        act(() => {
            audio.error = {code: 3} as MediaError;
            audio.dispatchEvent(new Event('error'));
        });
        await waitFor(() => expect(result.current.currentTrack?.musicKey).toBe(2));

        act(() => audio.dispatchEvent(new Event('error')));
        await waitFor(() => expect(result.current.notice?.text).toBe('所有歌曲暂时都无法播放'));
        expect(result.current.playing).toBe(false);
    });

    it('stops on a session failure without marking every track as broken', async () => {
        const player = document.createElement('section');
        const article = document.createElement('main');
        document.body.append(player, article);
        const prepareSource = vi.fn(() => Promise.reject(
            new AudioSourceError('媒体人机验证失败，请重试', false),
        ));
        const {result} = renderHook(() => useAudioController({
            playlist: tracks,
            volume: 0.72,
            playerRootRef: {current: player},
            prepareSource,
        }));

        act(() => article.dispatchEvent(new Event('pointerdown', {bubbles: true})));

        await waitFor(() => expect(result.current.notice?.text).toBe('媒体人机验证失败，请重试'));
        expect(result.current.currentTrack?.musicKey).toBe(1);
        expect(prepareSource).toHaveBeenCalledTimes(1);
    });

    it('returns no current track for an empty playlist', () => {
        const playerRootRef = {current: document.createElement('section')};
        const {result} = renderHook(() => useAudioController({playlist: [], volume: 0.72, playerRootRef}));
        expect(result.current.currentTrack).toBeUndefined();
    });

    it('keeps the current encrypted source when the new playlist still contains the track', async () => {
        const player = document.createElement('section');
        const article = document.createElement('main');
        document.body.append(player, article);
        const prepareSource = vi.fn(async (track: MusicTrack) => ({url: `blob:${track.musicKey}`, release: vi.fn()}));
        const {result, rerender} = renderHook(
            ({playlist}) => useAudioController({playlist, volume: 0.72, playerRootRef: {current: player}, prepareSource}),
            {initialProps: {playlist: tracks}},
        );

        act(() => article.dispatchEvent(new Event('pointerdown', {bubbles: true})));
        await waitFor(() => expect(prepareSource).toHaveBeenCalledTimes(1));
        rerender({playlist: [tracks[1], tracks[0]]});

        expect(result.current.currentTrack?.musicKey).toBe(1);
        expect(result.current.currentIndex).toBe(1);
        expect(prepareSource).toHaveBeenCalledTimes(1);
        expect(MockAudio.instances).toHaveLength(1);
    });

    it('switches to the first track and keeps play intent when the current track is absent', async () => {
        const player = document.createElement('section');
        const article = document.createElement('main');
        document.body.append(player, article);
        const prepareSource = vi.fn(async (track: MusicTrack) => ({url: `blob:${track.musicKey}`, release: vi.fn()}));
        const {result, rerender} = renderHook(
            ({playlist}) => useAudioController({playlist, volume: 0.72, playerRootRef: {current: player}, prepareSource}),
            {initialProps: {playlist: tracks}},
        );

        act(() => article.dispatchEvent(new Event('pointerdown', {bubbles: true})));
        await waitFor(() => expect(MockAudio.instances[0].play).toHaveBeenCalledTimes(1));
        rerender({playlist: [tracks[1]]});

        await waitFor(() => expect(result.current.currentTrack?.musicKey).toBe(2));
        await waitFor(() => expect(prepareSource).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(MockAudio.instances[0].play).toHaveBeenCalledTimes(2));
    });

    it('selects a track without starting playback while paused', async () => {
        const playerRootRef = {current: document.createElement('section')};
        const {result} = renderHook(() => useAudioController({playlist: tracks, volume: 0.72, playerRootRef}));

        act(() => result.current.selectTrack(2));

        await waitFor(() => expect(result.current.currentTrack?.musicKey).toBe(2));
        expect(MockAudio.instances[0].play).not.toHaveBeenCalled();
    });
});
