export function chunkNonce(prefix: Uint8Array, index: number): Uint8Array {
    const nonce = new Uint8Array(12);
    nonce.set(prefix, 0);
    new DataView(nonce.buffer).setUint32(8, index, false);
    return nonce;
}

export function chunkAad(header: ArrayBuffer, index: number, plaintextLength: number): Uint8Array {
    if (header.byteLength !== 64) throw new Error('PPM1 头长度无效');
    const aad = new Uint8Array(72);
    aad.set(new Uint8Array(header), 0);
    const view = new DataView(aad.buffer);
    view.setUint32(64, index, false);
    view.setUint32(68, plaintextLength, false);
    return aad;
}

export function decodeBase64Url(value: string): Uint8Array {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    return Uint8Array.from(atob(normalized), character => character.charCodeAt(0));
}
