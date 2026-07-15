import type {IssuedTrackKey, SecureTrackDescriptor} from '../model/types';

export interface RegisterMediaAssetMessage {
    type: 'register-media-asset';
    descriptor: SecureTrackDescriptor;
    details: IssuedTrackKey;
    key: CryptoKey;
}

export interface ReleaseMediaAssetMessage {
    type: 'release-media-asset';
    assetId: string;
}

export type SecureMediaWorkerMessage = RegisterMediaAssetMessage | ReleaseMediaAssetMessage;

export interface WorkerAcknowledgement {
    ok: boolean;
    error?: string;
}
