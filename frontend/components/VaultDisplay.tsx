'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Copy, Eye, EyeOff, Trash2, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCrypto } from '@/contexts/cryptocontext';
import { decryptData } from '@/lib/crypto';

type VaultEntry = {
    id: string;
    site: string;
    username: string;
};

type LicenseEntry = {
    id: string;
    product_name: string;
    description: string;
};

type VaultDisplayProps = {
    userToken: string;
    entries: (VaultEntry | LicenseEntry)[];
    setEntries: React.Dispatch<React.SetStateAction<(VaultEntry | LicenseEntry)[]>>;
    onEntriesLoaded?: (loadedEntries: (VaultEntry | LicenseEntry)[]) => void;
};

export default function VaultDisplay({
    userToken,
    entries,
    setEntries,
    onEntriesLoaded,
}: VaultDisplayProps) {
    const { derivedKey } = useCrypto();
    const [decryptedData, setDecryptedData] = useState<Record<string, string>>({});
    const [visible, setVisible] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPasswords, setShowPasswords] = useState(true);
    const [showKeys, setShowKeys] = useState(true);

    const setEntriesRef = useRef(setEntries);
    const onEntriesLoadedRef = useRef(onEntriesLoaded);
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        setEntriesRef.current = setEntries;
        onEntriesLoadedRef.current = onEntriesLoaded;
    }, [setEntries, onEntriesLoaded]);

    useEffect(() => {
        if (!userToken || hasLoaded || hasInitializedRef.current) return;

        hasInitializedRef.current = true;

        const fetchEntries = async () => {
            try {
                const [resCredentials, resProducts] = await Promise.all([
                    fetch(`/credentials`, {
                        headers: { Authorization: `Bearer ${userToken}` },
                    }),
                    fetch(`https://securepassvault-1.onrender.com/products/`, {
                        headers: { Authorization: `Bearer ${userToken}` },
                    }),
                ]);

                if (!resCredentials.ok || !resProducts.ok) {
                    const errCredentials = await resCredentials.json().catch(() => ({}));
                    const errProducts = await resProducts.json().catch(() => ({}));
                    throw new Error(errCredentials?.detail || errProducts?.detail || 'Failed to fetch entries');
                }

                const dataCredentials = await resCredentials.json();
                const dataProducts = await resProducts.json();

                const combined: (VaultEntry | LicenseEntry)[] = [...dataCredentials, ...dataProducts];
                setEntriesRef.current(combined);
                setHasLoaded(true);
                onEntriesLoadedRef.current?.(combined);
            } catch (err) {
                console.error('[Vault Fetch Error]', err);
                toast.error('Failed to load entries');
            }
        };

        fetchEntries();
    }, [userToken, hasLoaded]);

    const reveal = async (id: string, endpoint: string) => {
        if (!derivedKey) {
            toast.error('Encryption key not available.');
            return;
        }

        try {
            const res = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${userToken}` },
            });

            const json = await res.json();
            const encrypted: string | undefined =
                typeof json === 'string'
                    ? json
                    : json.password || json.license_key || json.key || json.license;

            if (!encrypted) throw new Error('No encrypted field in response.');

            const decrypted = await decryptData(derivedKey, encrypted);
            setDecryptedData((prev) => ({ ...prev, [id]: decrypted }));
        } catch (err) {
            console.error('[Reveal Error]', err);
            toast.error('Reveal failed.');
        }
    };

    const toggleVisibility = (id: string) => {
        setVisible((prev) => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };

    const handleCopy = (id: string) => {
        const text = decryptedData[id];
        if (text) {
            navigator.clipboard.writeText(text);
            toast.success('Copied!');
        } else {
            toast.error('Reveal first.');
        }
    };

    const handleDelete = async (id: string, isPassword: boolean) => {
        if (!confirm('Are you sure?')) return;

        try {
            const endpoint = isPassword
                ? `/credentials/delete/${id}`
                : `https://securepassvault-1.onrender.com/products/delete/${id}`;

            const res = await fetch(endpoint, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${userToken}` },
            });

            if (!res.ok) throw new Error(await res.text());
            setEntries((prev) => prev.filter((entry) => entry.id !== id));
            toast.success('Deleted!');
        } catch (err) {
            console.error('[Delete Error]', err);
            toast.error('Delete failed');
        }
    };

    const filteredPasswords = entries
        .filter((e): e is VaultEntry => 'site' in e && 'username' in e)
        .filter((e) =>
            `${e.site} ${e.username}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.site.localeCompare(b.site));

    const filteredLicenses = entries
        .filter((e): e is LicenseEntry => 'product_name' in e && 'description' in e)
        .filter((e) =>
            `${e.product_name} ${e.description}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.product_name.localeCompare(b.product_name));

    return (
        <div className="mt-6 max-w-2xl mx-auto w-full">
            <input
                type="text"
                placeholder="Search entries..."
                className="w-full mb-6 px-4 py-3 rounded-xl bg-white/5 border border-[color:var(--neon)]/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[color:var(--neon)]/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Password Section */}
            <div className="mb-6">
                <button
                    className="flex items-center gap-2 text-lg font-semibold text-white mb-2"
                    onClick={() => setShowPasswords((p) => !p)}
                >
                    {showPasswords ? <ChevronDown /> : <ChevronRight />}
                    Passwords
                </button>
                {showPasswords && filteredPasswords.length > 0 ? (
                    <ul className="space-y-4">
                        {filteredPasswords.map((entry) => {
                            const expanded = expandedId === entry.id;
                            const visibleVal = visible.has(entry.id);
                            return (
                                <li key={entry.id} className="rounded-xl bg-white/5 p-4 shadow">
                                    <div
                                        className="cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            setExpandedId(expanded ? null : entry.id);
                                            if (!decryptedData[entry.id]) {
                                                reveal(entry.id, `/credentials/reveal/${entry.id}`);
                                            }
                                        }}
                                    >
                                        <div>
                                            <p className="font-medium neon-text">{entry.site}</p>
                                            <p className="text-gray-400 text-sm">{entry.username}</p>
                                        </div>
                                        {expanded ? <ChevronUp /> : <ChevronDown />}
                                    </div>
                                    {expanded && (
                                        <div className="mt-2">
                                            <label className="text-xs text-gray-400">Password</label>
                                            <p className="text-base text-white break-all">
                                                {visibleVal ? decryptedData[entry.id] || '••••••••' : '••••••••'}
                                            </p>
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => toggleVisibility(entry.id)}>
                                                    {visibleVal ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button onClick={() => handleCopy(entry.id)}><Copy size={16} /></button>
                                                <button
                                                    onClick={() => handleDelete(entry.id, true)}
                                                    className="text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : showPasswords && <p className="text-gray-400">No passwords found.</p>}
            </div>

            {/* License Key Section */}
            <div>
                <button
                    className="flex items-center gap-2 text-lg font-semibold text-white mb-2"
                    onClick={() => setShowKeys((p) => !p)}
                >
                    {showKeys ? <ChevronDown /> : <ChevronRight />}
                    Product Keys
                </button>
                {showKeys && filteredLicenses.length > 0 ? (
                    <ul className="space-y-4">
                        {filteredLicenses.map((entry) => {
                            const expanded = expandedId === entry.id;
                            const visibleVal = visible.has(entry.id);
                            return (
                                <li key={entry.id} className="rounded-xl bg-white/5 p-4 shadow">
                                    <div
                                        className="cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            setExpandedId(expanded ? null : entry.id);
                                            if (!decryptedData[entry.id]) {
                                                reveal(entry.id, `https://securepassvault-1.onrender.com/products/reveal/${entry.id}`);
                                            }
                                        }}
                                    >
                                        <div>
                                            <p className="font-medium neon-text">{entry.product_name}</p>
                                            <p className="text-gray-400 text-sm">{entry.description || 'No description provided.'}</p>
                                        </div>
                                        {expanded ? <ChevronUp /> : <ChevronDown />}
                                    </div>
                                    {expanded && (
                                        <div className="mt-2">
                                            <label className="text-xs text-gray-400">License Key</label>
                                            <p className="text-base text-white break-all">
                                                {visibleVal ? decryptedData[entry.id] || '••••••••' : '••••••••'}
                                            </p>
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => toggleVisibility(entry.id)}>
                                                    {visibleVal ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button onClick={() => handleCopy(entry.id)}><Copy size={16} /></button>
                                                <button
                                                    onClick={() => handleDelete(entry.id, false)}
                                                    className="text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : showKeys && <p className="text-gray-400">No product keys found.</p>}
            </div>
        </div>
    );
}
