import {
    SPECTRUM_BAR_COUNT,
    SPECTRUM_FFT_SIZE,
    createLogFrequencyBands,
    mapFrequencyDataToBands,
} from '../lib/spectrum';
import type {AudioElementHandle} from '../model/types';

export interface SpectrumAnalyser {
    readonly barCount: number;
    activate: () => Promise<void>;
    sample: (output: Float32Array) => boolean;
    dispose: () => Promise<void>;
}

interface CapturableAudioElement extends HTMLAudioElement {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
}

const getAudioContextConstructor = () => (
    window.AudioContext
    ?? (window as typeof window & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext
);

const getCaptureStream = (audio: CapturableAudioElement) => (
    audio.captureStream?.bind(audio) ?? audio.mozCaptureStream?.bind(audio)
);

export const createSpectrumAnalyser = (audioHandle: AudioElementHandle): SpectrumAnalyser => {
    let context: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let silentOutput: GainNode | null = null;
    let capturedStream: MediaStream | null = null;
    let boundAudio: CapturableAudioElement | null = null;
    let frequencyData: Uint8Array | null = null;
    let frequencyBands: ReturnType<typeof createLogFrequencyBands> = [];
    let unavailable = false;
    let lastCaptureAttempt = 0;

    const resetCapture = () => {
        try {
            source?.disconnect();
            capturedStream?.getTracks().forEach(track => track.stop());
        } catch {
            // A stale captured track must not affect native playback.
        }
        source = null;
        capturedStream = null;
        lastCaptureAttempt = 0;
    };

    const connectCapture = () => {
        if (source || !context || !analyser || !boundAudio) return;
        const now = performance.now();
        if (lastCaptureAttempt > 0 && now - lastCaptureAttempt < 120) return;
        lastCaptureAttempt = now;
        const captureStream = getCaptureStream(boundAudio);
        if (!captureStream) {
            unavailable = true;
            return;
        }

        try {
            const stream = captureStream();
            if (!stream.getAudioTracks().length) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            const nextSource = context.createMediaStreamSource(stream);
            nextSource.connect(analyser);
            capturedStream = stream;
            source = nextSource;
        } catch {
            // The next play event may expose the captured audio track.
        }
    };

    const resumeContext = async () => {
        if (context?.state !== 'suspended') return;
        try {
            await context.resume();
        } catch {
            // Native media playback remains independent from this context.
        }
    };

    const activate = async () => {
        if (unavailable) return;
        if (context) {
            await resumeContext();
            if (!boundAudio?.paused) connectCapture();
            return;
        }

        const AudioContextConstructor = getAudioContextConstructor();
        const audio = audioHandle.getElement() as CapturableAudioElement | null;
        if (!AudioContextConstructor || !audio || !getCaptureStream(audio)) {
            unavailable = true;
            return;
        }

        let nextContext: AudioContext;
        try {
            nextContext = new AudioContextConstructor();
        } catch {
            unavailable = true;
            return;
        }

        try {
            const nextAnalyser = nextContext.createAnalyser();
            const nextSilentOutput = nextContext.createGain();
            nextAnalyser.fftSize = SPECTRUM_FFT_SIZE;
            nextAnalyser.smoothingTimeConstant = 0.42;
            nextSilentOutput.gain.value = 0;
            nextAnalyser.connect(nextSilentOutput);
            nextSilentOutput.connect(nextContext.destination);

            context = nextContext;
            analyser = nextAnalyser;
            silentOutput = nextSilentOutput;
            boundAudio = audio;
            frequencyData = new Uint8Array(nextAnalyser.frequencyBinCount);
            frequencyBands = createLogFrequencyBands(nextContext.sampleRate, nextAnalyser.fftSize);
            boundAudio.addEventListener('play', connectCapture);
            boundAudio.addEventListener('playing', connectCapture);
            boundAudio.addEventListener('emptied', resetCapture);
            boundAudio.addEventListener('loadstart', resetCapture);
        } catch {
            unavailable = true;
            try {
                await nextContext.close();
            } catch {
                // Native media output was never connected to this context.
            }
            return;
        }

        await resumeContext();
        if (!audio.paused) connectCapture();
    };

    const sample = (output: Float32Array) => {
        if (!source) connectCapture();
        if (!analyser || !frequencyData || !source || output.length < SPECTRUM_BAR_COUNT) return false;
        try {
            analyser.getByteFrequencyData(frequencyData);
            mapFrequencyDataToBands(frequencyData, frequencyBands, output);
            return true;
        } catch {
            return false;
        }
    };

    const dispose = async () => {
        boundAudio?.removeEventListener('play', connectCapture);
        boundAudio?.removeEventListener('playing', connectCapture);
        boundAudio?.removeEventListener('emptied', resetCapture);
        boundAudio?.removeEventListener('loadstart', resetCapture);
        try {
            resetCapture();
            analyser?.disconnect();
            silentOutput?.disconnect();
            if (context && context.state !== 'closed') await context.close();
        } catch {
            // Cleanup failures must not surface from a decorative analyser.
        }
        context = null;
        source = null;
        analyser = null;
        silentOutput = null;
        capturedStream = null;
        boundAudio = null;
        frequencyData = null;
    };

    return {barCount: SPECTRUM_BAR_COUNT, activate, sample, dispose};
};
