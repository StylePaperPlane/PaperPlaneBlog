export const SPECTRUM_BAR_COUNT = 20;
export const SPECTRUM_FFT_SIZE = 512;

export interface FrequencyBand {
    start: number;
    end: number;
}

export interface RhythmEnergy {
    bass: number;
    middle: number;
    treble: number;
    overall: number;
}

export const createLogFrequencyBands = (
    sampleRate: number,
    fftSize: number,
    barCount = SPECTRUM_BAR_COUNT,
    minimumFrequency = 60,
    maximumFrequency = 14_000,
): FrequencyBand[] => {
    const binCount = fftSize / 2;
    const nyquist = sampleRate / 2;
    const upperFrequency = Math.min(maximumFrequency, nyquist);
    const frequencyPerBin = sampleRate / fftSize;
    const ratio = Math.pow(upperFrequency / minimumFrequency, 1 / barCount);

    return Array.from({length: barCount}, (_, index) => {
        const lower = minimumFrequency * Math.pow(ratio, index);
        const upper = minimumFrequency * Math.pow(ratio, index + 1);
        const start = Math.min(binCount - 1, Math.max(0, Math.floor(lower / frequencyPerBin)));
        const end = Math.min(binCount, Math.max(start + 1, Math.ceil(upper / frequencyPerBin)));
        return {start, end};
    });
};

export const mapFrequencyDataToBands = (
    frequencyData: Uint8Array,
    bands: FrequencyBand[],
    output: Float32Array,
) => {
    bands.forEach((band, bandIndex) => {
        let sumOfSquares = 0;
        const end = Math.min(band.end, frequencyData.length);
        for (let index = band.start; index < end; index += 1) {
            const normalized = frequencyData[index] / 255;
            sumOfSquares += normalized * normalized;
        }
        const binLength = Math.max(1, end - band.start);
        output[bandIndex] = Math.min(1, Math.sqrt(sumOfSquares / binLength));
    });
};

export const advanceSpectrumLevels = (
    levels: Float32Array,
    targets: Float32Array,
    playing: boolean,
    elapsedMs: number,
) => {
    const normalizedFrame = Math.max(0.25, Math.min(4, elapsedMs / (1000 / 60)));
    const pauseRelease = Math.pow(0.94, normalizedFrame);

    for (let index = 0; index < levels.length; index += 1) {
        const target = playing ? targets[index] : 0;
        if (!playing) {
            levels[index] *= pauseRelease;
            continue;
        }
        const response = target > levels[index] ? 0.48 : 0.13;
        const adjustedResponse = 1 - Math.pow(1 - response, normalizedFrame);
        levels[index] += (target - levels[index]) * adjustedResponse;
    }
};

const averageRange = (levels: Float32Array, start: number, end: number) => {
    let total = 0;
    for (let index = start; index < end; index += 1) total += levels[index] ?? 0;
    return total / Math.max(1, end - start);
};

export const summarizeRhythmEnergy = (levels: Float32Array): RhythmEnergy => {
    const bassEnd = Math.max(1, Math.round(levels.length * 0.3));
    const middleEnd = Math.max(bassEnd + 1, Math.round(levels.length * 0.7));
    const bass = averageRange(levels, 0, bassEnd);
    const middle = averageRange(levels, bassEnd, middleEnd);
    const treble = averageRange(levels, middleEnd, levels.length);
    return {
        bass,
        middle,
        treble,
        overall: bass * 0.45 + middle * 0.4 + treble * 0.15,
    };
};
