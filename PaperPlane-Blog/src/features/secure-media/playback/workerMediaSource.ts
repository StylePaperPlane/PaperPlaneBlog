import type {PreparedAudioSource} from '../../music-player/model/types';
import type {SecureTrackDescriptor} from '../model/types';
import {requestTrackContentKey} from './trackKey';
import {registerMediaAsset} from '../worker/client';

export async function createWorkerMediaSource(
    descriptor: SecureTrackDescriptor,
    signal: AbortSignal,
): Promise<PreparedAudioSource> {
    const {key, details} = await requestTrackContentKey(descriptor.assetId, signal);
    if (details.audioFormat !== descriptor.audioFormat) {
        throw new Error('媒体格式与签发密钥不匹配');
    }
    return registerMediaAsset(descriptor, details, key, signal);
}
