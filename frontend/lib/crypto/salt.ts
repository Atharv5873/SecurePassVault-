export function generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
}

// Encode Uint8Array to base64 for transmission/storage
export function encodeSalt(salt: Uint8Array): string {
    return btoa(String.fromCharCode(...salt));
}

// Decode base64 salt back to Uint8Array
export function decodeSalt(base64Salt: string): Uint8Array {
    return Uint8Array.from(atob(base64Salt), char => char.charCodeAt(0));
}
  