import {afterEach, describe, expect, it, vi} from 'vitest';
import {bindSpectrumActivation} from './bindSpectrumActivation';
import type {SpectrumAnalyser} from './createSpectrumAnalyser';

const createAnalyser = () => ({
    barCount: 20,
    activate: vi.fn().mockResolvedValue(undefined),
    sample: vi.fn(() => false),
    dispose: vi.fn().mockResolvedValue(undefined),
}) satisfies SpectrumAnalyser;

describe('bindSpectrumActivation', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('never activates Web Audio from the pointer that requests native playback', () => {
        vi.useFakeTimers();
        const audio = Object.assign(new EventTarget(), {paused: true}) as unknown as HTMLAudioElement;
        const analyser = createAnalyser();
        const cleanup = bindSpectrumActivation({getElement: () => audio}, analyser);

        document.dispatchEvent(new Event('pointerdown'));
        vi.advanceTimersByTime(500);

        expect(analyser.activate).not.toHaveBeenCalled();
        cleanup();
    });

    it('attaches the analyser only after native playback is established', () => {
        vi.useFakeTimers();
        const audio = Object.assign(new EventTarget(), {paused: false}) as unknown as HTMLAudioElement;
        const analyser = createAnalyser();
        const cleanup = bindSpectrumActivation({getElement: () => audio}, analyser);

        audio.dispatchEvent(new Event('playing'));
        vi.advanceTimersByTime(179);
        expect(analyser.activate).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(analyser.activate).toHaveBeenCalledTimes(1);
        cleanup();
    });

    it('can resume an existing analyser on later interactions while audio is playing', () => {
        const audio = Object.assign(new EventTarget(), {paused: false}) as unknown as HTMLAudioElement;
        const analyser = createAnalyser();
        const cleanup = bindSpectrumActivation({getElement: () => audio}, analyser);

        document.dispatchEvent(new Event('pointerdown'));

        expect(analyser.activate).toHaveBeenCalledTimes(1);
        cleanup();
    });
});
