import {mediaClient} from "../api/client";
import {getDeviceIdentity} from "../identity/deviceIdentity";

let sessionPromise: Promise<void> | undefined;
let sessionExpiresAt = 0;

export function ensurePlaybackSession(force = false): Promise<void> {
    if (force) sessionExpiresAt = 0;
    if (Date.now() < sessionExpiresAt - 60_000) return Promise.resolve();
    sessionPromise ??= createSession().finally(() => { sessionPromise = undefined; });
    return sessionPromise;
}

async function createSession(): Promise<void> {
    const identity = await getDeviceIdentity();
    const {data, error} = await mediaClient.POST('/v1/playback/sessions', {
        body: {
            fingerprintSha256: identity.fingerprintSha256,
            fingerprintVersion: identity.fingerprintVersion,
            devicePublicKey: {
                kty: 'RSA', alg: 'RSA-OAEP-256',
                n: identity.publicJwk.n ?? '', e: identity.publicJwk.e ?? '',
            },
        },
    });
    if (error || !data) throw new Error('无法建立安全播放会话');
    const expiresAt = (data as {data?: {expiresAt?: string}}).data?.expiresAt;
    sessionExpiresAt = expiresAt ? Date.parse(expiresAt) : Date.now() + 11 * 60 * 60 * 1000;
}
