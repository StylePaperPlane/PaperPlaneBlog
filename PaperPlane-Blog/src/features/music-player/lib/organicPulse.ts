export interface OrganicPulseState {
    values: Float32Array;
    targets: Float32Array;
    remainingMs: Float32Array;
}

export type RandomSource = () => number;

export const createOrganicPulseState = (channelCount: number): OrganicPulseState => ({
    values: new Float32Array(channelCount),
    targets: new Float32Array(channelCount),
    remainingMs: new Float32Array(channelCount),
});

const clampSigned = (value: number) => Math.max(-1, Math.min(1, value));

export const advanceOrganicPulse = (
    state: OrganicPulseState,
    playing: boolean,
    elapsedMs: number,
    random: RandomSource = Math.random,
) => {
    const frameScale = Math.max(0.25, Math.min(4, elapsedMs / (1000 / 60)));

    for (let index = 0; index < state.values.length; index += 1) {
        if (playing) {
            state.remainingMs[index] -= elapsedMs;
            if (state.remainingMs[index] <= 0) {
                state.targets[index] = clampSigned(random() * 2 - 1);
                state.remainingMs[index] = 110 + random() * 190;
            }
        } else {
            state.targets[index] = 0;
            state.remainingMs[index] = 0;
        }

        const response = playing ? 0.08 : 0.055;
        const adjustedResponse = 1 - Math.pow(1 - response, frameScale);
        state.values[index] += (state.targets[index] - state.values[index]) * adjustedResponse;
        state.values[index] = clampSigned(state.values[index]);
    }

    return state.values;
};
