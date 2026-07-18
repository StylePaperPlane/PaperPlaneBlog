import type {SpectrumAnalyser} from './createSpectrumAnalyser';
import type {AudioElementHandle} from '../model/types';

const SPECTRUM_ATTACH_DELAY_MS = 180;

export const bindSpectrumActivation = (
    audioHandle: AudioElementHandle,
    analyser: SpectrumAnalyser,
    documentTarget: Document = document,
) => {
    const audio = audioHandle.getElement();
    let attachTimer: number | null = null;

    const clearAttachTimer = () => {
        if (attachTimer === null) return;
        window.clearTimeout(attachTimer);
        attachTimer = null;
    };
    const activateAfterPlaybackStarts = () => {
        clearAttachTimer();
        attachTimer = window.setTimeout(() => {
            attachTimer = null;
            if (!audio?.paused) void analyser.activate();
        }, SPECTRUM_ATTACH_DELAY_MS);
    };
    const resumeWhilePlaying = () => {
        if (!audio?.paused) void analyser.activate();
    };

    audio?.addEventListener('play', activateAfterPlaybackStarts);
    audio?.addEventListener('playing', activateAfterPlaybackStarts);
    documentTarget.addEventListener('pointerdown', resumeWhilePlaying, {passive: true});
    documentTarget.addEventListener('keydown', resumeWhilePlaying);

    return () => {
        clearAttachTimer();
        audio?.removeEventListener('play', activateAfterPlaybackStarts);
        audio?.removeEventListener('playing', activateAfterPlaybackStarts);
        documentTarget.removeEventListener('pointerdown', resumeWhilePlaying);
        documentTarget.removeEventListener('keydown', resumeWhilePlaying);
    };
};
