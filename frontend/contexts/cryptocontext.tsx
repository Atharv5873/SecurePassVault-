'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { deriveKeyFromPassword } from '@/lib/crypto/deriveKey';

interface CryptoCtx {
    derivedKey: CryptoKey | null;
    setDerivedKey: (key: CryptoKey) => void;
    clearDerivedKey: () => void;
}

const CryptoContext = createContext<CryptoCtx | undefined>(undefined);

export function CryptoProvider({ children }: { children: React.ReactNode }) {
    const [derivedKey, setDerivedKey] = useState<CryptoKey | null>(null);

    const clearDerivedKey = () => {
        setDerivedKey(null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('salt');
    };

    // Automatically restore session
    useEffect(() => {
        const autoRestore = async () => {
            const token = sessionStorage.getItem('token');
            const salt = sessionStorage.getItem('salt');
            const password = sessionStorage.getItem('vault-password'); // Temporarily stored during login
            const storedKey = sessionStorage.getItem('derivedKey');

            if (token && salt && password) {
                try {
                    // Convert base64 salt string to Uint8Array
                    const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
                    const key = await deriveKeyFromPassword(password, saltBytes);
                    setDerivedKey(key);
                } catch (err) {
                    console.error('Auto-restore failed:', err);
                    clearDerivedKey();
                }
            }
        };

        autoRestore();
    }, []);

    return (
        <CryptoContext.Provider value={{ derivedKey, setDerivedKey, clearDerivedKey }}>
            {children}
        </CryptoContext.Provider>
    );
}

export function useCrypto() {
    const context = useContext(CryptoContext);
    if (!context) throw new Error('useCrypto must be used within CryptoProvider');
    return context;
}
