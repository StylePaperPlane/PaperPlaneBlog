import type {IssuedTrackKey, SecureTrackDescriptor} from '../model/types';
import {cipherChunkRange} from './chunkRange';
import {chunkAad, chunkNonce, decodeBase64Url} from './ppm1';

const HEADER_LENGTH = 64;

export interface Ppm1StreamContext {
    descriptor: SecureTrackDescriptor;
    details: IssuedTrackKey;
    key: CryptoKey;
    header: ArrayBuffer;
}

export async function openPpm1Stream(
    descriptor: SecureTrackDescriptor,
    details: IssuedTrackKey,
    key: CryptoKey,
    signal: AbortSignal,
): Promise<Ppm1StreamContext> {
    const header = await fetchCipherRange(descriptor.cipherUrl, 0, HEADER_LENGTH - 1, signal);
    validateHeader(header, descriptor, details);
    return {descriptor, details, key, header};
}

export async function decryptPpm1Chunk(
    context: Ppm1StreamContext,
    index: number,
    signal: AbortSignal,
): Promise<Uint8Array> {
    const {descriptor, details, key, header} = context;
    if (index < 0 || index >= descriptor.chunkCount) throw new RangeError('PPM1 分块序号越界');
    const cipherRange = cipherChunkRange(index, descriptor.chunkSize, descriptor.plaintextSize);
    const ciphertext = await fetchCipherRange(descriptor.cipherUrl, cipherRange.start, cipherRange.end, signal);
    const plaintextLength = Math.min(
        descriptor.chunkSize,
        descriptor.plaintextSize - index * descriptor.chunkSize,
    );
    const plaintext = await crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv: chunkNonce(decodeBase64Url(details.noncePrefix), index),
        additionalData: chunkAad(header, index, plaintextLength),
        tagLength: 128,
    }, key, ciphertext);
    return new Uint8Array(plaintext);
}

async function fetchCipherRange(url: string, start: number, end: number, signal: AbortSignal): Promise<ArrayBuffer> {
    const response = await fetch(url, {
        headers: {Range: `bytes=${start}-${end}`},
        cache: 'force-cache',
        signal,
    });
    if (response.status !== 206) throw new Error('密文 CDN 未返回有效 Range');
    const expectedLength = end - start + 1;
    const body = await response.arrayBuffer();
    if (body.byteLength !== expectedLength) throw new Error('密文 CDN 返回长度不完整');
    return body;
}

function validateHeader(header: ArrayBuffer, descriptor: SecureTrackDescriptor, details: IssuedTrackKey): void {
    if (header.byteLength !== HEADER_LENGTH) throw new Error('PPM1 头长度无效');
    const bytes = new Uint8Array(header);
    const view = new DataView(header);
    const magic = String.fromCharCode(...bytes.slice(0, 4));
    const plaintextSize = Number(view.getBigUint64(12, false));
    if (magic !== 'PPM1' || bytes[4] !== 1 || view.getUint16(6, false) !== HEADER_LENGTH) {
        throw new Error('PPM1 文件格式无效');
    }
    if (bytes.slice(48).some(byte => byte !== 0)) throw new Error('PPM1 保留头字段无效');
    if (
        view.getUint32(8, false) !== descriptor.chunkSize
        || plaintextSize !== descriptor.plaintextSize
        || view.getUint32(20, false) !== descriptor.chunkCount
        || details.chunkSize !== descriptor.chunkSize
        || details.plaintextSize !== descriptor.plaintextSize
        || details.chunkCount !== descriptor.chunkCount
        || details.audioFormat !== descriptor.audioFormat
    ) throw new Error('PPM1 描述与曲目不匹配');
    if (formatUuid(bytes.slice(32, 48)) !== descriptor.assetId.toLowerCase()) {
        throw new Error('PPM1 资产 ID 与曲目不匹配');
    }
    if (!descriptor.cipherUrl.toLowerCase().includes(details.cipherSha256.toLowerCase())) {
        throw new Error('PPM1 密文哈希与签发密钥不匹配');
    }
    const noncePrefix = bytes.slice(24, 32);
    const issuedPrefix = decodeBase64Url(details.noncePrefix);
    if (noncePrefix.length !== issuedPrefix.length || noncePrefix.some((byte, index) => byte !== issuedPrefix[index])) {
        throw new Error('PPM1 nonce 与签发密钥不匹配');
    }
}

function formatUuid(bytes: Uint8Array): string {
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
