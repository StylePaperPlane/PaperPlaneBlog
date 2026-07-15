import type {MusicTrack} from "../../../interface/MusicType";
import type {AudioFormat} from './audioFormat';

export interface DeviceIdentity {
    privateKey: CryptoKey;
    publicJwk: JsonWebKey;
    fingerprintSha256: string;
    fingerprintVersion: 1;
}

export interface SecureTrackDescriptor {
    assetId: string;
    cipherUrl: string;
    plaintextSize: number;
    chunkSize: number;
    chunkCount: number;
    audioFormat: AudioFormat;
}

export interface IssuedTrackKey {
    assetId: string;
    wrappedKey: string;
    algorithm: 'RSA-OAEP-256';
    expiresAt: string;
    plaintextSize: number;
    chunkSize: number;
    chunkCount: number;
    noncePrefix: string;
    cipherSha256: string;
    audioFormat: AudioFormat;
}

export function toSecureDescriptor(track: MusicTrack): SecureTrackDescriptor | null {
    if (
        !track.assetId
        || !track.cipherUrl
        || track.plaintextSize === undefined
        || !track.chunkSize
        || track.chunkCount === undefined
        || (track.audioFormat !== 'mp3' && track.audioFormat !== 'flac')
    ) {
        return null;
    }
    return {
        assetId: track.assetId,
        cipherUrl: track.cipherUrl,
        plaintextSize: track.plaintextSize,
        chunkSize: track.chunkSize,
        chunkCount: track.chunkCount,
        audioFormat: track.audioFormat,
    };
}
