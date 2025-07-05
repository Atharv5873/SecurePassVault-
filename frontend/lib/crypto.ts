'use client';

import { scrypt } from 'scrypt-js';

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
        throw new Error("Web Crypto API not supported or running in non-browser environment.");
    }

    const N = 2 ** 15; // 32768 — high but still OK in browsers
    const r = 8;       // Block size
    const p = 1;       // Parallelization
    const dkLen = 32;  // AES-256 => 32 bytes

    const passwordBytes = new TextEncoder().encode(password);

    const derivedKeyBytes = await scrypt(passwordBytes, salt, N, r, p, dkLen);

    return crypto.subtle.importKey(
        'raw',
        new Uint8Array(derivedKeyBytes),
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}


export async function encryptData(key: CryptoKey, data: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(data));
    const combined = new Uint8Array(iv.byteLength + cipher.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipher), iv.byteLength);
    return btoa(String.fromCharCode(...combined));
}

export async function decryptData(key: CryptoKey, b64: string): Promise<string> {
    const combined = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
}
  