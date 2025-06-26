export async function encryptData(key: CryptoKey, plainText: string): Promise<string> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = encoder.encode(plainText);

    const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    );

    // Combine IV and cipher into a single base64 string
    const combined = new Uint8Array(iv.byteLength + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.byteLength);

    return btoa(String.fromCharCode(...combined));
}
  