import { scrypt } from 'scrypt-js';

/**
 * Derives a CryptoKey using scrypt for AES-GCM encryption/decryption.
 * @param password The user’s password.
 * @param salt A unique 16–32 byte Uint8Array salt.
 * @returns CryptoKey usable for AES-GCM.
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
        throw new Error("Web Crypto API not supported or running in non-browser environment.");
    }

    const N = 2 ** 15; // Recommended cost
    const r = 8;
    const p = 1;
    const dkLen = 32; // 256 bits for AES-GCM

    const passwordBytes = new TextEncoder().encode(password);

    const derivedBytes = await scrypt(passwordBytes, salt, N, r, p, dkLen);

    const derivedKey = await crypto.subtle.importKey(
        'raw',
        new Uint8Array(derivedBytes),
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    return derivedKey;
}
