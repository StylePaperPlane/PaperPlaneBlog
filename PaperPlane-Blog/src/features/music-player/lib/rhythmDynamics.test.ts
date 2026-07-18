import {describe, expect, it} from 'vitest';
import {advanceRhythmDynamics, createRhythmDynamicsState} from './rhythmDynamics';

const FRAME_MS = 1000 / 60;

const advanceFrames = (
    frames: number,
    state: ReturnType<typeof createRhythmDynamicsState>,
    samples: Float32Array,
    output: Float32Array,
    playing = true,
) => {
    for (let frame = 0; frame < frames; frame += 1) {
        advanceRhythmDynamics(state, samples, output, playing, FRAME_MS);
    }
};

describe('advanceRhythmDynamics', () => {
    it('keeps a steady passage below the transient peak', () => {
        const state = createRhythmDynamicsState(20);
        const samples = new Float32Array(20).fill(0.24);
        const output = new Float32Array(20);

        advanceFrames(180, state, samples, output);

        expect(output[0]).toBeGreaterThan(0.12);
        expect(output[0]).toBeLessThan(0.4);
    });

    it('turns a real energy onset into a pronounced visual pulse', () => {
        const state = createRhythmDynamicsState(20);
        const samples = new Float32Array(20).fill(0.16);
        const output = new Float32Array(20);
        advanceFrames(180, state, samples, output);
        const steady = output[0];

        samples.fill(0.72);
        advanceFrames(2, state, samples, output);

        expect(output[0] - steady).toBeGreaterThan(0.35);
        expect(output[0]).toBeGreaterThan(0.7);
    });

    it('fades monotonically to a fully transparent resting state', () => {
        const state = createRhythmDynamicsState(20);
        const samples = new Float32Array(20).fill(0.7);
        const output = new Float32Array(20);
        advanceFrames(2, state, samples, output);
        let previous = output[0];

        for (let frame = 0; frame < 180; frame += 1) {
            advanceRhythmDynamics(state, samples, output, false, FRAME_MS);
            expect(output[0]).toBeLessThanOrEqual(previous);
            previous = output[0];
        }

        expect(output[0]).toBe(0);
    });
});
