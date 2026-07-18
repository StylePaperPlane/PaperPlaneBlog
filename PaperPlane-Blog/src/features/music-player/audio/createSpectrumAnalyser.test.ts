import {afterEach, describe, expect, it, vi} from 'vitest';
import {createSpectrumAnalyser} from './createSpectrumAnalyser';

afterEach(() => {
    vi.unstubAllGlobals();
});

const createAudioGraph = () => {
    const analyserNode = {
        fftSize: 0,
        smoothingTimeConstant: 0,
        frequencyBinCount: 256,
        connect: vi.fn(),
        disconnect: vi.fn(),
        getByteFrequencyData: vi.fn((output: Uint8Array) => output.fill(128)),
    };
    const sourceNode = {connect: vi.fn(), disconnect: vi.fn()};
    const silentOutput = {gain: {value: 1}, connect: vi.fn(), disconnect: vi.fn()};
    const context = {
        state: 'running',
        sampleRate: 48_000,
        destination: {},
        createAnalyser: vi.fn(() => analyserNode),
        createGain: vi.fn(() => silentOutput),
        createMediaStreamSource: vi.fn(() => sourceNode),
        createMediaElementSource: vi.fn(),
        resume: vi.fn(async () => undefined),
        close: vi.fn(async () => undefined),
    };
    return {analyserNode, sourceNode, silentOutput, context};
};

describe('createSpectrumAnalyser', () => {
    it('captures a side stream without taking over native media output', async () => {
        const graph = createAudioGraph();
        vi.stubGlobal('AudioContext', vi.fn(function MockAudioContext() {
            return graph.context;
        }));
        const track = {stop: vi.fn()};
        const stream = {getAudioTracks: () => [track], getTracks: () => [track]};
        const audio = Object.assign(new EventTarget(), {
            paused: false,
            captureStream: vi.fn(() => stream),
        }) as unknown as HTMLAudioElement;
        const spectrum = createSpectrumAnalyser({getElement: () => audio});

        await spectrum.activate();
        await spectrum.activate();
        const output = new Float32Array(spectrum.barCount);

        expect(graph.context.createMediaElementSource).not.toHaveBeenCalled();
        expect(graph.context.createMediaStreamSource).toHaveBeenCalledTimes(1);
        expect(graph.sourceNode.connect).toHaveBeenCalledWith(graph.analyserNode);
        expect(graph.silentOutput.gain.value).toBe(0);
        expect(graph.analyserNode.connect).toHaveBeenCalledWith(graph.silentOutput);
        expect(graph.silentOutput.connect).toHaveBeenCalledWith(graph.context.destination);
        expect(spectrum.sample(output)).toBe(true);
        expect(Math.max(...output)).toBeGreaterThan(0);

        await spectrum.dispose();
        expect(track.stop).toHaveBeenCalledTimes(1);
        expect(graph.context.close).toHaveBeenCalledTimes(1);
    });

    it('waits for playback before capturing an audio track', async () => {
        const graph = createAudioGraph();
        vi.stubGlobal('AudioContext', vi.fn(function MockAudioContext() {
            return graph.context;
        }));
        const track = {stop: vi.fn()};
        const stream = {getAudioTracks: () => [track], getTracks: () => [track]};
        const audio = Object.assign(new EventTarget(), {
            paused: true,
            captureStream: vi.fn(() => stream),
        }) as unknown as HTMLAudioElement;
        const spectrum = createSpectrumAnalyser({getElement: () => audio});

        await spectrum.activate();
        expect(graph.context.createMediaStreamSource).not.toHaveBeenCalled();

        audio.dispatchEvent(new Event('play'));
        await new Promise(resolve => setTimeout(resolve, 125));
        expect(graph.context.createMediaStreamSource).toHaveBeenCalledTimes(1);
    });

    it('retries capture when the audio track appears at the playing event', async () => {
        const graph = createAudioGraph();
        vi.stubGlobal('AudioContext', vi.fn(function MockAudioContext() {
            return graph.context;
        }));
        const track = {stop: vi.fn()};
        const emptyStream = {getAudioTracks: () => [], getTracks: () => []};
        const readyStream = {getAudioTracks: () => [track], getTracks: () => [track]};
        const captureStream = vi.fn()
            .mockReturnValueOnce(emptyStream)
            .mockReturnValue(readyStream);
        const audio = Object.assign(new EventTarget(), {paused: false, captureStream}) as unknown as HTMLAudioElement;
        const spectrum = createSpectrumAnalyser({getElement: () => audio});

        await spectrum.activate();
        expect(graph.context.createMediaStreamSource).not.toHaveBeenCalled();

        await new Promise(resolve => setTimeout(resolve, 125));
        audio.dispatchEvent(new Event('playing'));
        expect(graph.context.createMediaStreamSource).toHaveBeenCalledTimes(1);
        expect(spectrum.sample(new Float32Array(spectrum.barCount))).toBe(true);
    });

    it('reconnects the side stream after the audio source changes', async () => {
        const graph = createAudioGraph();
        vi.stubGlobal('AudioContext', vi.fn(function MockAudioContext() {
            return graph.context;
        }));
        const firstTrack = {stop: vi.fn()};
        const secondTrack = {stop: vi.fn()};
        const streams = [firstTrack, secondTrack].map(track => ({
            getAudioTracks: () => [track],
            getTracks: () => [track],
        }));
        const audio = Object.assign(new EventTarget(), {
            paused: false,
            captureStream: vi.fn()
                .mockReturnValueOnce(streams[0])
                .mockReturnValue(streams[1]),
        }) as unknown as HTMLAudioElement;
        const spectrum = createSpectrumAnalyser({getElement: () => audio});

        await spectrum.activate();
        expect(graph.context.createMediaStreamSource).toHaveBeenCalledTimes(1);

        audio.dispatchEvent(new Event('emptied'));
        expect(firstTrack.stop).toHaveBeenCalledTimes(1);
        audio.dispatchEvent(new Event('playing'));

        expect(graph.context.createMediaStreamSource).toHaveBeenCalledTimes(2);
        expect(graph.sourceNode.connect).toHaveBeenCalledTimes(2);
    });

    it('degrades without captureStream and never touches native playback', async () => {
        const graph = createAudioGraph();
        vi.stubGlobal('AudioContext', vi.fn(function MockAudioContext() {
            return graph.context;
        }));
        const audio = document.createElement('audio');
        const spectrum = createSpectrumAnalyser({getElement: () => audio});

        await expect(spectrum.activate()).resolves.toBeUndefined();
        expect(graph.context.createMediaElementSource).not.toHaveBeenCalled();
        expect(graph.context.createMediaStreamSource).not.toHaveBeenCalled();
        expect(spectrum.sample(new Float32Array(spectrum.barCount))).toBe(false);
    });

    it('degrades without Web Audio and never blocks playback', async () => {
        vi.stubGlobal('AudioContext', undefined);
        const spectrum = createSpectrumAnalyser({getElement: () => document.createElement('audio')});
        await expect(spectrum.activate()).resolves.toBeUndefined();
        expect(spectrum.sample(new Float32Array(spectrum.barCount))).toBe(false);
    });
});
