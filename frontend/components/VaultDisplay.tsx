'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Copy, Eye, EyeOff, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
    onEntriesLoaded?: (loadedEntries: VaultEntry[]) => void;
};

export default function VaultDisplay({ userToken, entries, setEntries, onEntriesLoaded }: VaultDisplayProps) {
    const { derivedKey } = useCrypto();
    const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const setEntriesRef = useRef(setEntries);
    const onEntriesLoadedRef = useRef(onEntriesLoaded);
    const hasInitializedRef = useRef(false);

    // Update refs when props change
    useEffect(() => {
        setEntriesRef.current = setEntries;
        onEntriesLoadedRef.current = onEntriesLoaded;
    }, [setEntries, onEntriesLoaded]);

    useEffect(() => {
        console.log('VaultDisplay useEffect triggered', { userToken: !!userToken, hasLoaded });

        if (userToken && !hasLoaded && !hasInitializedRef.current) {
            console.log('Calling fetchEntries...');
            hasInitializedRef.current = true;

            const fetchEntries = async () => {
                try {
                    console.log('Fetching entries...');
                    setIsLoading(true);

                    const res = await fetch(`https://securepassvault-1.onrender.com/credentials`, {
                        headers: {
                            Authorization: `Bearer ${userToken}`,
                        },
                    });

                    console.log('Response status:', res.status);
                    console.log('Response headers:', res.headers);

                    const data = await res.json(); // Will fail if it's not JSON
                    console.log('Fetched data:', data);

                    if (!res.ok) {
                        console.error('API Error:', res.status, data);
                        throw new Error(`API Error: ${res.status} - ${data.detail || 'Unknown error'}`);
                    }

                    if (!Array.isArray(data)) {
                        console.error('Invalid data format:', data);
                        throw new Error('Invalid response format');
                    }

                    setEntriesRef.current(data);
                    console.log('Entries set:', data);
                    setHasLoaded(true);
                    if (onEntriesLoadedRef.current) {
                        onEntriesLoadedRef.current(data);
                    }
                } catch (err) {
                    console.error('[Vault Fetch Error]', err);
                    toast.error(`Error loading entries: ${err instanceof Error ? err.message : 'Unknown error'}`);
                    setHasLoaded(true);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchEntries();
        }
    }, [userToken, hasLoaded]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--neon)]"></div>
                <span className="ml-3 text-gray-400">Loading entries...</span>
            </div>
        );
    }

    if (hasLoaded && entries.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#181c1b] rounded-full flex items-center justify-center border border-[color:var(--neon)]/30">
                    <svg className="w-12 h-12 text-[color:var(--neon)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Your vault is empty</h3>
                <p className="text-gray-400 mb-6">Start by adding your first secure entry</p>
            </div>
        );
    }

    const revealPassword = async (id: string) => {
        try {
            if (!derivedKey) {
                toast.error('Encryption key not available. Please login again.');
                return;
            }

            const res = await fetch(`https://securepassvault-1.onrender.com/credentials/reveal/${id}`, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });

            if (!res.ok) throw new Error(await res.text());

            const { password: encryptedPassword } = await res.json();

            const decrypted = await decryptData(derivedKey, encryptedPassword);
            setDecryptedPasswords((prev) => ({ ...prev, [id]: decrypted }));
        } catch (err) {
            console.error(`[Reveal Error for ${id}]`, err);
            toast.error('Failed to reveal password.');
        }
    };

    const handleExpand = (id: string) => {
        setExpandedId(prev => (prev === id ? null : id));
        if (!decryptedPasswords[id]) {
            revealPassword(id);
        }
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this password?')) return;

        try {
            const res = await fetch(`https://securepassvault-1.onrender.com/credentials/delete/${id}`, {
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
        <div className="mt-8 max-w-2xl mx-auto w-full">
            <ul className="space-y-4">
                {entries.map((entry) => {
                    const expanded = expandedId === entry.id;
                    const passwordVisible = visiblePasswords.has(entry.id);
                    return (
                        <li key={entry.id} className={`rounded-xl bg-white/5 border border-[color:var(--neon)]/30 shadow-lg transition-all duration-300 ${expanded ? 'ring-2 ring-[color:var(--neon)]/60' : ''}`}>
                            <button
                                className="w-full flex items-center justify-between px-6 py-4 focus:outline-none group"
                                onClick={() => handleExpand(entry.id)}
                                aria-expanded={expanded}
                            >
                                <div className="flex flex-col text-left">
                                    <span className="text-lg font-semibold neon-text group-hover:underline">{entry.site}</span>
                                    <span className="text-gray-400 text-sm">{entry.username}</span>
                                </div>
                                <span className="ml-4 text-[color:var(--neon)]">
                                    {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </span>
                            </button>
                            {expanded && (
                                <div className="px-6 pb-4 pt-2 animate-fade-in">
                                    <div className="flex flex-col gap-2 mb-2">
                                        <label className="text-xs text-gray-400">Password</label>
                                        <span className="text-base text-white tracking-wider select-all">
                                            {passwordVisible ? (decryptedPasswords[entry.id] || '••••••••••') : '••••••••••'}
                                        </span>
                                        <div className="flex gap-2 mt-1">
                                            <button
                                                onClick={() => togglePasswordVisibility(entry.id)}
                                                title={passwordVisible ? "Hide password" : "Show password"}
                                                className="text-[color:var(--neon)] hover:text-blue-400 p-1 rounded"
                                            >
                                                {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button onClick={() => handleCopy(entry.id)} title="Copy" className="text-[color:var(--neon)] hover:text-blue-400 p-1 rounded">
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-2">
                                        <button onClick={() => handleExpand(entry.id)} className="px-4 py-2 rounded-md bg-gray-800 text-gray-200 hover:bg-gray-700 transition">Close</button>
                                        <button onClick={() => handleDelete(entry.id)} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-1"><Trash2 size={16} /> Delete</button>
                                    </div>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
