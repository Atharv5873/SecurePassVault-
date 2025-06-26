export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    // 1. Encode password to ArrayBuffer
    const enc = new TextEncoder();
    const passKey = enc.encode(password);

    // 2. Import raw password into a key format
    const baseKey = await crypto.subtle.importKey(
        'raw',
        passKey,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    // 3. Derive key using PBKDF2 with the provided salt
    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt, // secure random or user-specific salt
            iterations: 100000,
            hash: 'SHA-256',
        },
        baseKey,
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    );

    return derivedKey;
}
  