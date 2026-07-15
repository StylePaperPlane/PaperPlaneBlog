import FingerprintJS from '@fingerprintjs/fingerprintjs';

import type {DeviceIdentity} from "../model/types";
import {readIdentity, writeIdentity} from "../storage/database";

let identityPromise: Promise<DeviceIdentity> | undefined;

export function getDeviceIdentity(): Promise<DeviceIdentity> {
    identityPromise ??= loadOrCreateIdentity();
    return identityPromise;
}

async function loadOrCreateIdentity(): Promise<DeviceIdentity> {
    const stored = await readIdentity();
    if (stored?.privateKey?.usages.includes('unwrapKey') && stored.publicJwk && stored.fingerprintSha256) return stored;

    const [{visitorId}, keyPair] = await Promise.all([
        FingerprintJS.load().then(agent => agent.get()),
        createDeviceKeyPair(),
    ]);
    const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const identity: DeviceIdentity = {
        privateKey: keyPair.privateKey,
        publicJwk: {...publicJwk, alg: 'RSA-OAEP-256'},
        fingerprintSha256: await sha256(visitorId),
        fingerprintVersion: 1,
    };
    await writeIdentity(identity);
    return identity;
}

export function createDeviceKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(
        {name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256'},
        false,
        ['wrapKey', 'unwrapKey'],
    );
}

async function sha256(value: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
