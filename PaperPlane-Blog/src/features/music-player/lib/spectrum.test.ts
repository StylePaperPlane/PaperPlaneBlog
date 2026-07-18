import {describe, expect, it} from 'vitest';
import {
    advanceSpectrumLevels,
    createLogFrequencyBands,
    mapFrequencyDataToBands,
    summarizeRhythmEnergy,
} from './spectrum';

describe('music spectrum', () => {
    it('maps real frequency bins into logarithmic display bands', () => {
        const bands = createLogFrequencyBands(48_000, 512, 20);
        const frequencyData = new Uint8Array(256);
        frequencyData[Math.round(1_000 / (48_000 / 512))] = 255;
        const output = new Float32Array(20);

        mapFrequencyDataToBands(frequencyData, bands, output);

        expect(bands).toHaveLength(20);
        expect(Math.max(...output)).toBeGreaterThan(0);
        expect(output.filter(value => value > 0)).toHaveLength(1);
    });

    it('raises quickly while playing and decays gradually after pause', () => {
        const levels = new Float32Array([0]);
        const targets = new Float32Array([1]);

        advanceSpectrumLevels(levels, targets, true, 1000 / 60);
        expect(levels[0]).toBeCloseTo(0.48, 2);

        levels[0] = 1;
        advanceSpectrumLevels(levels, targets, false, 1000 / 60);
        expect(levels[0]).toBeGreaterThan(0.9);
        expect(levels[0]).toBeLessThan(1);

        for (let frame = 0; frame < 71; frame += 1) {
            advanceSpectrumLevels(levels, targets, false, 1000 / 60);
        }
        expect(levels[0]).toBeLessThan(0.02);
    });

    it('summarizes real frequency bands into glow energy', () => {
        const levels = new Float32Array([
            1, 1, 1, 1, 1, 1,
            0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
            0.2, 0.2, 0.2, 0.2, 0.2, 0.2,
        ]);

        const energy = summarizeRhythmEnergy(levels);

        expect(energy.bass).toBeCloseTo(1);
        expect(energy.middle).toBeCloseTo(0.5);
        expect(energy.treble).toBeCloseTo(0.2);
        expect(energy.overall).toBeCloseTo(0.68);
    });
});
