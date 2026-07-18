export interface DiffuseGlowLobe {
    centerXRatio: number;
    reachRatio: number;
    widthRatio: number;
    opacity: number;
}

export const DIFFUSE_GLOW_RANDOM_CHANNELS = 6;

const clamp = (value: number, minimum: number, maximum: number) => (
    Math.max(minimum, Math.min(maximum, value))
);

const averageRange = (levels: Float32Array, startRatio: number, endRatio: number) => {
    const start = Math.floor(levels.length * startRatio);
    const end = Math.max(start + 1, Math.ceil(levels.length * endRatio));
    let total = 0;
    for (let index = start; index < Math.min(end, levels.length); index += 1) {
        total += levels[index] ?? 0;
    }
    return total / Math.max(1, Math.min(end, levels.length) - start);
};

const shapeAudioEnergy = (value: number) => clamp(Math.pow(value, 0.9), 0, 1);

const glowOpacity = (energy: number, maximum: number) => {
    if (energy < 0.004) return 0;
    return clamp(Math.pow(energy, 0.68) * maximum, 0, maximum);
};

export const buildDiffuseGlowLobes = (
    levels: Float32Array,
    organic: Float32Array,
): DiffuseGlowLobe[] => {
    const leftEnergy = shapeAudioEnergy(averageRange(levels, 0, 0.38));
    const middleEnergy = shapeAudioEnergy(averageRange(levels, 0.24, 0.78));
    const rightEnergy = shapeAudioEnergy(averageRange(levels, 0.62, 1));
    const centerEnergy = Math.max(middleEnergy, leftEnergy * 0.86, rightEnergy * 0.86);
    const centerReach = clamp(
        0.035 + centerEnergy * 0.85 * (1 + (organic[1] ?? 0) * 0.004),
        0.035,
        0.885,
    );
    const leftReach = Math.min(
        centerReach * 0.7,
        0.03 + leftEnergy * 0.48 * (1 + (organic[3] ?? 0) * 0.025),
    );
    const rightReach = Math.min(
        centerReach * 0.72,
        0.03 + rightEnergy * 0.48 * (1 + (organic[5] ?? 0) * 0.025),
    );

    return [
        {
            centerXRatio: 0.22 + (organic[0] ?? 0) * 0.012,
            reachRatio: leftReach,
            widthRatio: 0.3 + leftEnergy * 0.08,
            opacity: glowOpacity(leftEnergy, 0.36),
        },
        {
            centerXRatio: 0.5 + (organic[1] ?? 0) * 0.005,
            reachRatio: centerReach,
            widthRatio: 0.36 + centerEnergy * 0.12,
            opacity: glowOpacity(centerEnergy, 0.46),
        },
        {
            centerXRatio: 0.78 + (organic[2] ?? 0) * 0.012,
            reachRatio: rightReach,
            widthRatio: 0.3 + rightEnergy * 0.08,
            opacity: glowOpacity(rightEnergy, 0.36),
        },
    ];
};
