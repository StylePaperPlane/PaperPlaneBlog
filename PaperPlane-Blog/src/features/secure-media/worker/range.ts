export interface PlaintextRange {
    start: number;
    end: number;
    partial: boolean;
}

export class InvalidMediaRangeError extends Error {
    constructor() {
        super('仅支持单段有效字节 Range');
        this.name = 'InvalidMediaRangeError';
    }
}

export function parsePlaintextRange(value: string | null, total: number): PlaintextRange {
    if (!Number.isSafeInteger(total) || total <= 0) throw new InvalidMediaRangeError();
    if (!value) return {start: 0, end: total - 1, partial: false};
    if (!value.startsWith('bytes=') || value.includes(',')) throw new InvalidMediaRangeError();

    const [rawStart, rawEnd] = value.slice(6).split('-', 2);
    if (!rawStart && !rawEnd) throw new InvalidMediaRangeError();
    if (!rawStart) {
        const suffixLength = Number(rawEnd);
        if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) throw new InvalidMediaRangeError();
        return {start: Math.max(0, total - suffixLength), end: total - 1, partial: true};
    }

    const start = Number(rawStart);
    const end = rawEnd ? Number(rawEnd) : total - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || end >= total) {
        throw new InvalidMediaRangeError();
    }
    return {start, end, partial: true};
}
