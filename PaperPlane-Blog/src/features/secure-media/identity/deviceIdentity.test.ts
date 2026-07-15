import {describe, expect, it} from 'vitest';

import {createDeviceKeyPair} from './deviceIdentity';

describe('secure media device key', () => {
    it('keeps the private RSA key non-extractable and usable only for unwrap', async () => {
        const keyPair = await createDeviceKeyPair();
        expect(keyPair.privateKey.extractable).toBe(false);
        expect(keyPair.privateKey.usages).toEqual(['unwrapKey']);
        expect(keyPair.publicKey.usages).toEqual(['wrapKey']);
        await expect(crypto.subtle.exportKey('jwk', keyPair.privateKey)).rejects.toThrow();
    });
});
