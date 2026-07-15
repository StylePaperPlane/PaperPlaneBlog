export interface ByteRange { start: number; end: number }

export function cipherChunkRange(index: number, chunkSize: number, plaintextSize: number): ByteRange {
    const plaintextLength = Math.min(chunkSize, plaintextSize - index * chunkSize);
    const start = 64 + index * (chunkSize + 16);
    return {start, end: start + plaintextLength + 16 - 1};
}
