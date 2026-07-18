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

export interface ClaimMediaClientsMessage {
    type: 'claim-media-clients';
}

export type SecureMediaWorkerMessage = RegisterMediaAssetMessage | ReleaseMediaAssetMessage | ClaimMediaClientsMessage;

export interface WorkerAcknowledgement {
    ok: boolean;
    error?: string;
}
