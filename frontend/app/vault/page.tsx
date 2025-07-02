'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import VaultForm from '@/components/vaultform';
import VaultDisplay from '@/components/VaultDisplay';
import LogoutButton from '@/components/logoutbutton';
import type { VaultEntry } from '../types/vault';
import Image from 'next/image';
import { useCrypto } from '@/contexts/cryptocontext';
import PasswordChecker from '@/components/passwordchecker';

export default function VaultPage() {
    const [token, setToken] = useState<string | null>(null);
    const [entries, setEntries] = useState<VaultEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'vault' | 'add'>('vault');
    const [entriesLoaded, setEntriesLoaded] = useState(false);
    const [userEmail, setUserEmail] = useState<string>('');
    const router = useRouter();
    const { derivedKey } = useCrypto();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const savedToken = sessionStorage.getItem('token');
        const savedEmail = sessionStorage.getItem('user-email');
        if (!savedToken) {
            router.replace('/');
        } else {
            setToken(savedToken);
            if (savedEmail) setUserEmail(savedEmail);
        }
    }, [router]);

    const handleNewEntry = (newEntry: VaultEntry) => {
        setEntries((prev) => [...prev, newEntry]);
        setActiveTab('vault');
    };

    const handleEntriesLoaded = (loadedEntries: VaultEntry[]) => {
        setEntries(loadedEntries);
        setEntriesLoaded(true);
    };

    const getUsername = (email: string) => {
        if (!email.includes('@')) return 'User';
        return email.split('@')[0];
    };

    if (!token || !derivedKey) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--neon)] mx-auto mb-4"></div>
                    <p className="text-gray-400">
                        {!token ? 'Loading...' : 'Initializing encryption...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
            {/* Left Panel */}
            <div className="w-full lg:w-80 lg:fixed lg:top-0 lg:left-0 lg:bottom-0 bg-black border-r border-[color:var(--neon)]/20 z-10 flex flex-col h-screen">
                {/* Top and Scrollable Content */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <div className="p-4 lg:p-6 border-b border-[color:var(--neon)]/20">
                        <div className="flex items-center space-x-3">
                            <Image src="/applogo.png.png" alt="SecurePass Vault" width={40} height={40} className="object-contain" />
                            <div>
                                <h1 className="text-lg lg:text-xl font-bold neon-text">SecurePass</h1>
                                <p className="text-xs text-gray-400">Vault</p>
                            </div>
                        </div>
                    </div>

                    <nav className="p-4 lg:p-6">
                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveTab('vault')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${activeTab === 'vault' ? 'bg-[color:var(--neon)]/20 border border-[color:var(--neon)]/40 neon-text' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <span>My Vault</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('add')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${activeTab === 'add' ? 'bg-[color:var(--neon)]/20 border border-[color:var(--neon)]/40 neon-text' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>Add Entry</span>
                            </button>
                            <br />
                            <br />
                            <PasswordChecker />
                        </div>
                    </nav>
                </div>

                {/* Fixed Bottom User Info */}
                <div className="p-4 lg:p-6 border-t border-[color:var(--neon)]/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[color:var(--neon)] rounded-full flex items-center justify-center">
                                <span className="text-black font-bold text-sm">{getUsername(userEmail).charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium">{getUsername(userEmail)}</p>
                                <p className="text-xs text-gray-400">Secure Account</p>
                            </div>
                        </div>
                        <LogoutButton />
                    </div>
                </div>
            </div>

            {/* Right Panel (Scrollable) */}
            <div className="flex-1 lg:ml-80 min-h-screen overflow-y-auto bg-[#0d0e10] flex flex-col">
                <header className="bg-[#181c1b]/50 backdrop-blur-sm border-b border-[color:var(--neon)]/20 p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold">
                                {activeTab === 'vault' ? 'My Secure Vault' : 'Add New Entry'}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {activeTab === 'vault' ? (entriesLoaded ? `${entries.length} entries stored securely` : 'Loading entries...') : 'Create a new secure entry'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Encrypted</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-6">
                    <div className="max-w-full lg:max-w-6xl mx-auto">
                        {activeTab === 'vault' ? (
                            <div className="space-y-6">
                                <VaultDisplay
                                    userToken={token}
                                    entries={entries}
                                    setEntries={setEntries}
                                    onEntriesLoaded={handleEntriesLoaded}
                                />
                            </div>
                        ) : (
                            <div className="max-w-full lg:max-w-2xl mx-auto">
                                <div className="bg-[#181c1b] border border-[color:var(--neon)]/30 rounded-2xl p-6 lg:p-8 shadow-xl">
                                    <VaultForm userToken={token} onNewEntry={handleNewEntry} />
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
