import {describe, expect, it} from 'vitest';
import {advanceOrganicPulse, createOrganicPulseState} from './organicPulse';

describe('organicPulse', () => {
    it('adds bounded smooth movement while audio is playing', () => {
        const state = createOrganicPulseState(2);
        const values = advanceOrganicPulse(state, true, 16, () => 1);

        expect(values[0]).toBeGreaterThan(0);
        expect(values[0]).toBeLessThan(1);
        expect(values[1]).toBeGreaterThan(0);
        expect(state.targets).toEqual(new Float32Array([1, 1]));
        expect(state.remainingMs[0]).toBe(300);
    });

    it('decays the random envelope when playback pauses', () => {
        const state = createOrganicPulseState(1);
        advanceOrganicPulse(state, true, 16, () => 1);
        const playingValue = state.values[0];
        advanceOrganicPulse(state, false, 200, () => 1);
        const firstPauseValue = state.values[0];
        advanceOrganicPulse(state, false, 200, () => 1);

        expect(firstPauseValue).toBeLessThan(playingValue);
        expect(state.values[0]).toBeLessThan(firstPauseValue);
        expect(state.targets[0]).toBe(0);
    });
});
