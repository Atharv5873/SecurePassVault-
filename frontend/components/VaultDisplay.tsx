'use client';
import React, { useEffect, useState } from 'react';
import { Copy, Eye, EyeOff, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCrypto } from '@/contexts/cryptocontext';
import { decryptData } from '@/lib/crypto';

type VaultEntry = {
    id: string;
    site: string;
    username: string;
};

type VaultDisplayProps = {
    userToken: string;
    entries: VaultEntry[];
    setEntries: React.Dispatch<React.SetStateAction<VaultEntry[]>>;
};

export default function VaultDisplay({ userToken, entries, setEntries }: VaultDisplayProps) {
    const { derivedKey } = useCrypto();
    const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
    const [showPasswordIds, setShowPasswordIds] = useState<Set<string>>(new Set());

    const fetchEntries = async () => {
        try {

            const res = await fetch(`/credentials`, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });

            const data = await res.json(); // Will fail if it's not JSON
            if (!res.ok || !Array.isArray(data)) throw new Error('Invalid response');

            setEntries(data);
        } catch (err) {
            console.error('[Vault Fetch Error]', err);
            toast.error('Error loading entries.');
        }
    };

    useEffect(() => {
        if (userToken) {
            fetchEntries();
        }
    }, [userToken]);

    const revealPassword = async (id: string) => {
        try {
            const res = await fetch(`/credentials/reveal/${id}`, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });

            if (!res.ok) throw new Error(await res.text());

            const { password: encryptedPassword } = await res.json();

            if (!derivedKey) {
                toast.error('Encryption key not available.');
                return;
            }

            const decrypted = await decryptData(derivedKey, encryptedPassword);
            setDecryptedPasswords((prev) => ({ ...prev, [id]: decrypted }));
        } catch (err) {
            console.error(`[Reveal Error for ${id}]`, err);
            toast.error('Failed to reveal password.');
        }
    };

    const toggleVisibility = async (id: string) => {
        const updated = new Set(showPasswordIds);
        if (updated.has(id)) {
            updated.delete(id);
        } else {
            updated.add(id);
            if (!decryptedPasswords[id]) {
                await revealPassword(id);
            }
        }
        setShowPasswordIds(updated);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this password?')) return;

        try {
            const res = await fetch(`/credentials/delete/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });

            if (!res.ok) throw new Error(await res.text());

            setEntries((prev) => prev.filter((entry) => entry.id !== id));
            toast.success('Deleted!');
        } catch (err) {
            console.error('[Delete Error]', err);
            toast.error('Delete failed.');
        }
    };

    const handleCopy = (id: string) => {
        const text = decryptedPasswords[id];
        if (text) {
            navigator.clipboard.writeText(text);
            toast.success('Password copied!');
        } else {
            toast.error('Reveal password first.');
        }
    };

    return (
        <div className="mt-8 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry, idx) => (
                <div
                    key={entry.id || `entry-${idx}`}
                    className="bg-slate-800 border border-teal-500/30 p-5 rounded-2xl shadow-md flex flex-col justify-between space-y-3 transition-transform hover:scale-[1.02]"
                >
                    <h3 className="text-lg sm:text-xl font-semibold text-teal-300 truncate">{entry.site}</h3>

                    <div className="flex items-center gap-2 text-sm sm:text-base text-white">
                        <span className="text-purple-400">👤</span>
                        <span className="break-words">{entry.username}</span>
                    </div>

                    <p className="text-sm sm:text-base text-gray-100 break-all">
                        {showPasswordIds.has(entry.id)
                            ? decryptedPasswords[entry.id] || '••••••••••'
                            : '••••••••••'}
                    </p>

                    <div className="flex gap-4 mt-2 text-teal-400">
                        <button onClick={() => toggleVisibility(entry.id)} title="Toggle visibility">
                            {showPasswordIds.has(entry.id) ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        <button onClick={() => handleCopy(entry.id)} title="Copy">
                            <Copy size={20} />
                        </button>
                        <button onClick={() => handleDelete(entry.id)} title="Delete">
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
    
}
