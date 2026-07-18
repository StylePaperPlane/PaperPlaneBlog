import {describe, expect, it} from 'vitest';
import {buildDiffuseGlowLobes, DIFFUSE_GLOW_RANDOM_CHANNELS} from './diffuseGlow';

describe('buildDiffuseGlowLobes', () => {
    it('is fully transparent without audio energy', () => {
        const lobes = buildDiffuseGlowLobes(
            new Float32Array(20),
            new Float32Array(DIFFUSE_GLOW_RANDOM_CHANNELS),
        );

        expect(lobes.every((lobe) => lobe.opacity === 0)).toBe(true);
    });

    it('makes active audio visibly brighter without adding a resting glow', () => {
        const lobes = buildDiffuseGlowLobes(
            new Float32Array(20).fill(0.35),
            new Float32Array(DIFFUSE_GLOW_RANDOM_CHANNELS),
        );

        expect(lobes[1].opacity).toBeGreaterThan(0.18);
        expect(lobes[0].opacity).toBeGreaterThan(0.14);
    });

    it('keeps the middle diffusion tallest and raises it above four fifths', () => {
        const loud = new Float32Array(20).fill(1);
        const lobes = buildDiffuseGlowLobes(loud, new Float32Array(DIFFUSE_GLOW_RANDOM_CHANNELS));

        expect(lobes).toHaveLength(3);
        expect(lobes[1].reachRatio).toBe(0.885);
        expect(lobes[1].reachRatio).toBeGreaterThan(lobes[0].reachRatio);
        expect(lobes[1].reachRatio).toBeGreaterThan(lobes[2].reachRatio);
        expect(lobes[1].opacity).toBeGreaterThan(0.45);
    });

    it('uses broad overlapping fields instead of narrow outlined peaks', () => {
        const lobes = buildDiffuseGlowLobes(
            new Float32Array(20).fill(0.5),
            new Float32Array(DIFFUSE_GLOW_RANDOM_CHANNELS),
        );

        expect(lobes[0].widthRatio).toBeGreaterThan(0.3);
        expect(lobes[1].widthRatio).toBeGreaterThan(0.4);
        expect(lobes[2].widthRatio).toBeGreaterThan(0.3);
    });

    it('expands substantially more between quiet and strong passages', () => {
        const organic = new Float32Array(DIFFUSE_GLOW_RANDOM_CHANNELS);
        const quiet = buildDiffuseGlowLobes(new Float32Array(20).fill(0.08), organic)[1];
        const strong = buildDiffuseGlowLobes(new Float32Array(20).fill(0.45), organic)[1];

        expect(strong.reachRatio - quiet.reachRatio).toBeGreaterThan(0.25);
        expect(strong.widthRatio - quiet.widthRatio).toBeGreaterThan(0.04);
        expect(strong.opacity - quiet.opacity).toBeGreaterThan(0.12);
    });

    it('keeps audio energy materially stronger than organic movement', () => {
        const quiet = new Float32Array(20).fill(0.15);
        const medium = new Float32Array(20).fill(0.45);
        const neutral = new Float32Array(DIFFUSE_GLOW_RANDOM_CHANNELS);
        const organic = new Float32Array(DIFFUSE_GLOW_RANDOM_CHANNELS).fill(1);
        const quietCenter = buildDiffuseGlowLobes(quiet, neutral)[1];
        const mediumCenter = buildDiffuseGlowLobes(medium, neutral)[1];
        const disturbedCenter = buildDiffuseGlowLobes(medium, organic)[1];
        const audioDelta = mediumCenter.reachRatio - quietCenter.reachRatio;
        const organicDelta = Math.abs(disturbedCenter.reachRatio - mediumCenter.reachRatio);

        expect(audioDelta).toBeGreaterThan(organicDelta * 10);
    });
});
