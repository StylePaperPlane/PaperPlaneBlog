export interface RhythmDynamicsState {
    fastEnvelope: Float32Array;
    slowEnvelope: Float32Array;
    transientPeak: Float32Array;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const frameAdjustedResponse = (response: number, frameScale: number) => (
    1 - Math.pow(1 - response, frameScale)
);

export const createRhythmDynamicsState = (channelCount: number): RhythmDynamicsState => ({
    fastEnvelope: new Float32Array(channelCount),
    slowEnvelope: new Float32Array(channelCount),
    transientPeak: new Float32Array(channelCount),
});

export const resetRhythmDynamicsState = (state: RhythmDynamicsState) => {
    state.fastEnvelope.fill(0);
    state.slowEnvelope.fill(0);
    state.transientPeak.fill(0);
};

export const advanceRhythmDynamics = (
    state: RhythmDynamicsState,
    samples: Float32Array,
    output: Float32Array,
    playing: boolean,
    elapsedMs: number,
) => {
    const frameScale = Math.max(0.25, Math.min(4, elapsedMs / (1000 / 60)));

    if (!playing) {
        const release = Math.pow(0.94, frameScale);
        for (let index = 0; index < output.length; index += 1) {
            output[index] = output[index] * release < 0.003 ? 0 : output[index] * release;
            state.fastEnvelope[index] *= release;
            state.slowEnvelope[index] *= release;
            state.transientPeak[index] *= release;
        }
        return;
    }

    for (let index = 0; index < output.length; index += 1) {
        const sample = clamp01(samples[index] ?? 0);
        const fastResponse = sample > state.fastEnvelope[index] ? 0.52 : 0.18;
        state.fastEnvelope[index] += (sample - state.fastEnvelope[index])
            * frameAdjustedResponse(fastResponse, frameScale);
        state.slowEnvelope[index] += (sample - state.slowEnvelope[index])
            * frameAdjustedResponse(0.018, frameScale);

        const transient = Math.max(0, state.fastEnvelope[index] - state.slowEnvelope[index]);
        const peakRelease = Math.pow(0.982, frameScale);
        state.transientPeak[index] = Math.max(transient, state.transientPeak[index] * peakRelease);

        const transientReference = Math.max(
            state.transientPeak[index],
            state.slowEnvelope[index] * 0.35,
            0.02,
        );
        const relativeTransient = transientReference > 0
            ? clamp01(transient / transientReference)
            : 0;
        const relativeBody = sample > 0.004
            ? clamp01(sample / (state.slowEnvelope[index] * 1.8 + 0.035))
            : 0;
        const target = sample > 0.004
            ? clamp01(relativeBody * 0.3 + relativeTransient * 0.7)
            : 0;
        const outputResponse = target > output[index] ? 0.58 : 0.2;
        output[index] += (target - output[index])
            * frameAdjustedResponse(outputResponse, frameScale);
    }
};
