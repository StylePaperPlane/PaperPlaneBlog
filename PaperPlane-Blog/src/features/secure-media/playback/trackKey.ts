import {mediaBaseUrl} from '../api/client';
import {getDeviceIdentity} from '../identity/deviceIdentity';
import type {IssuedTrackKey} from '../model/types';
import {asSecureMediaSessionError, SecureMediaSessionError} from '../model/errors';
import {ensurePlaybackSession} from '../session/playbackSession';
import {decodeBase64Url} from './ppm1';

export interface TrackContentKey {
    key: CryptoKey;
    details: IssuedTrackKey;
}

export async function requestTrackContentKey(assetId: string, signal: AbortSignal): Promise<TrackContentKey> {
    let identity: Awaited<ReturnType<typeof getDeviceIdentity>>;
    try {
        [identity] = await Promise.all([getDeviceIdentity(), ensurePlaybackSession()]);
    } catch (error) {
        throw asSecureMediaSessionError(error, '无法建立安全播放会话');
    }
    let response = await issueTrackKey(assetId, identity.fingerprintSha256, signal);
    if (response.status === 401) {
        try {
            await ensurePlaybackSession(true);
        } catch (error) {
            throw asSecureMediaSessionError(error, '安全播放会话刷新失败');
        }
        response = await issueTrackKey(assetId, identity.fingerprintSha256, signal);
    }
    if (!response.ok) {
        if (response.status === 401 || response.status >= 500) {
            throw new SecureMediaSessionError(response.status === 401 ? '安全播放会话已过期，请重新播放' : '安全媒体服务暂时不可用');
        }
        throw new Error('当前歌曲的媒体密钥不可用');
    }

    const payload = await response.json() as {data: IssuedTrackKey};
    if (payload.data.assetId !== assetId) throw new Error('媒体密钥与曲目不匹配');
    let key: CryptoKey;
    try {
        key = await crypto.subtle.unwrapKey(
            'raw', decodeBase64Url(payload.data.wrappedKey), identity.privateKey, {name: 'RSA-OAEP'},
            {name: 'AES-GCM', length: 256}, false, ['decrypt'],
        );
    } catch {
        throw new SecureMediaSessionError('设备媒体密钥解包失败，请重新建立播放会话');
    }
    return {key, details: payload.data};
}

function issueTrackKey(assetId: string, fingerprintSha256: string, signal: AbortSignal): Promise<Response> {
    return fetch(`${mediaBaseUrl}/v1/playback/tracks/${assetId}/key`, {
        method: 'POST',
        credentials: 'include',
        headers: {'X-Media-Fingerprint': fingerprintSha256},
        signal,
        cache: 'no-store',
    });
}
