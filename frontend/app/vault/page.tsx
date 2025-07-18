'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import VaultForm from '@/components/vaultform';
import VaultDisplay from '@/components/VaultDisplay';
import LogoutButton from '@/components/logoutbutton';
import type { ApiEntry, LicenseEntry, NoteEntry, VaultEntry } from '../types/vault';
import Image from 'next/image';
import { useCrypto } from '@/contexts/cryptocontext';
import PasswordChecker from '@/components/passwordchecker';
import License from '@/components/licenseForm';
import NoteForm from '@/components/noteForm';
import Api from '@/components/apiForm';
import { Code, Gauge, Key, KeyRound, Plus, StickyNote, WandSparkles, Menu, X } from 'lucide-react';
import GenerateStrongPassword from '@/components/pwgen';

export default function VaultPage() {
    const [token, setToken] = useState<string | null>(null);
    const [entries, setEntries] = useState<(VaultEntry | LicenseEntry | NoteEntry | ApiEntry)[]>([]);
    const [activeTab, setActiveTab] = useState<'vault' | 'add' | 'pw' | 'addkey' | 'addnote' | 'addapi' | 'pgen'>('vault');
    const [entriesLoaded, setEntriesLoaded] = useState(false);
    const [userEmail, setUserEmail] = useState<string>('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const encryptedPassword = sessionStorage.getItem('vault-password');

        if (!derivedKey || !encryptedPassword) {
            sessionStorage.clear();
            router.replace('/');
        }
    }, [derivedKey, router]);

    useEffect(() => {
        const checkKeyIntegrity = () => {
            const token = sessionStorage.getItem('token');
            const encryptedPassword = sessionStorage.getItem('vault-password');
            if (!token || !encryptedPassword) {
                router.replace('/');
            }
        };

        const interval = setInterval(checkKeyIntegrity, 5000);
        return () => clearInterval(interval);
    }, [router]);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarOpen && window.innerWidth < 1024) {
                const sidebar = document.getElementById('sidebar');
                const menuButton = document.getElementById('menu-button');
                if (sidebar && !sidebar.contains(event.target as Node) &&
                    menuButton && !menuButton.contains(event.target as Node)) {
                    setSidebarOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen]);

    const handleNewEntry = (newEntry: VaultEntry | LicenseEntry | NoteEntry | ApiEntry) => {
        setEntries((prev) => [...prev, newEntry]);
        setActiveTab('vault');
        // Close sidebar on mobile after adding entry
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    const handleEntriesLoaded = (loadedEntries: (VaultEntry | LicenseEntry | NoteEntry | ApiEntry)[]) => {
        setEntries(loadedEntries);
        setEntriesLoaded(true);
    };

    const getUsername = (email: string) => {
        if (!email.includes('@')) return 'User';
        return email.split('@')[0];
    };

    const handleTabChange = (tab: 'vault' | 'add' | 'pw' | 'addkey' | 'addnote' | 'addapi' | 'pgen') => {
        setActiveTab(tab);
        // Close sidebar on mobile after tab change
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
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
        <div className="min-h-screen bg-black text-white">
            {/* Mobile Menu Button */}
            <button
                id="menu-button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-[color:var(--neon)]/20 border border-[color:var(--neon)]/40 rounded-lg p-2 backdrop-blur-sm"
            >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
            )}

            {/* Sidebar */}
            <div
                id="sidebar"
                className={`
                    w-80 
                    fixed 
                    top-0 left-0 bottom-0 
                    bg-black border-r border-[color:var(--neon)]/20 
                    z-50 lg:z-10 
                    flex flex-col h-screen
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <div className="p-4 lg:p-6 border-b border-[color:var(--neon)]/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Image src="/applogo.png.png" alt="SecurePass Vault" width={40} height={40} className="object-contain" />
                                <div>
                                    <h1 className="text-lg lg:text-xl font-bold neon-text">SecurePass</h1>
                                    <p className="text-xs text-gray-400">Vault</p>
                                </div>
                            </div>
                            {/* Close button for mobile */}
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-2 hover:bg-gray-800/50 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <nav className="p-4 lg:p-6">
                        <div className="space-y-2">
                            <button
                                onClick={() => handleTabChange('vault')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${activeTab === 'vault' ? 'bg-[color:var(--neon)]/20 border border-[color:var(--neon)]/40 neon-text' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
                            >
                                <svg
                                    className="w-6 h-6 text-currentColor"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.8}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    {/* Vault body */}
                                    <rect x="3" y="5" width="14" height="14" rx="2" ry="2" />
                                    {/* Door outline (open, on the right) */}
                                    <path d="M17 5v14l4-2V7l-4-2z" />
                                    {/* Central dial */}
                                    <circle cx="10" cy="12" r="1.5" />
                                    <line x1="10" y1="12" x2="12.5" y2="12" />
                                    <line x1="10" y1="12" x2="9" y2="14" />
                                </svg>
                                <span>My Vault</span>
                            </button>
                            <button
                                onClick={() => handleTabChange('add')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${activeTab === 'add' ? 'bg-[color:var(--neon)]/20 border border-[color:var(--neon)]/40 neon-text' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
                            >
                                <Key className="w-5 h-5 text-currentColor" />
                                <span>Add Credential</span>
                            </button>
                            <button
                                onClick={() => handleTabChange('addkey')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${activeTab === 'addkey' ? 'bg-[color:var(--neon)]/20 border border-[color:var(--neon)]/40 neon-text' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
                            >
                                <div className="relative w-6 h-6 text-currentColor">
                                    <KeyRound className="absolute inset-0 w-auto h-auto" strokeWidth={1.5} />
                                    <Plus className="absolute text-white inset-0 w-4 h-4 m-auto" strokeWidth={2} />
                                </div>
                                <span>Add Product Key</span>
                            </button>
                            <button
                                onClick={() => handleTabChange('addnote')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${activeTab === 'addnote' ? 'bg-[color:var(--neon)]/20 border border-[color:var(--neon)]/40 neon-text' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
                            >
                                <div className="relative w-6 h-6 text-currentColor">
                                    <StickyNote className="absolute inset-0 w-auto h-auto" strokeWidth={1.5} />
                                    <Plus className="absolute text-white inset-0 w-4 h-4 m-auto" strokeWidth={2} />
                                </div>
                                <span>Add a Secret Note</span>
                            </button>
                            <button
                                onClick={() => handleTabChange('addapi')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${activeTab === 'addapi' ? 'bg-[color:var(--neon)]/20 border border-[color:var(--neon)]/40 neon-text' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
                            >
                                <div className="relative w-6 h-6 text-currentColor">
                                    <Code className="absolute inset-0 w-auto h-auto" strokeWidth={1.5} />
                                    <Plus className="absolute text-white inset-0 w-4 h-4 m-auto" strokeWidth={2} />
                                </div>
                                <span>Add API Key</span>
                            </button>
                            <button
                                onClick={() => handleTabChange('pw')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${activeTab === 'pw' ? 'bg-[color:var(--neon)]/20 border border-[color:var(--neon)]/40 neon-text' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
                            >
                                <Gauge className="w-6 h-6 text-currentColor" />
                                <span>Check Password Strength</span>
                            </button>
                            <button
                                onClick={() => handleTabChange('pgen')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${activeTab === 'pgen' ? 'bg-[color:var(--neon)]/20 border border-[color:var(--neon)]/40 neon-text' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
                            >
                                <WandSparkles className="w-6 h-6 text-currentColor" />
                                <span>Generate Strong Password</span>
                            </button>
                        </div>
                    </nav>
                </div>

                {/* Sidebar footer with user info and logout - only visible on desktop */}
                <div className="hidden lg:block p-4 lg:p-6 border-t border-[color:var(--neon)]/20">
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

            {/* Main content */}
            <div className="ml-0 lg:ml-80 min-h-screen overflow-y-auto bg-gradient-to-br from-black via-gray-950 to-gray-900 flex flex-col">
                <header className="bg-gradient-to-br from-black via-gray-900 to-gray-950/50 backdrop-blur-sm border-b border-[color:var(--neon)]/20 p-4 lg:p-6 pt-16 lg:pt-4">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold">
                                {{
                                    vault: 'My Secure Vault',
                                    add: 'Add New Credential',
                                    addkey: 'Add Product Key',
                                    pw: 'Password Strength Checker',
                                    addnote: 'Add Secret Note',
                                    addapi: 'Add API Key',
                                    pgen: 'Generate Strong Password'
                                }[activeTab]}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {activeTab === 'vault'
                                    ? entriesLoaded
                                        ? `${entries.length} entries stored securely`
                                        : 'Loading entries...'
                                    : activeTab === 'add'
                                        ? 'Create a new secure password entry'
                                        : activeTab === 'addkey'
                                            ? 'Store product license keys securely'
                                            : activeTab === 'addnote'
                                                ? 'Add a secret note to your vault'
                                                : activeTab === 'addapi'
                                                    ? 'Store API keys securely'
                                                    : activeTab === 'pgen'
                                                        ? 'Generate a strong password'
                                                        : 'Check the strength of your passwords'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>Encrypted</span>
                            </div>
                            {/* Mobile user info and logout button */}
                            <div className="lg:hidden flex items-center space-x-3">
                                <div className="flex items-center space-x-2 bg-[color:var(--neon)]/20 border border-[color:var(--neon)]/40 rounded-lg px-3 py-1 backdrop-blur-sm">
                                    <div className="w-6 h-6 bg-[color:var(--neon)] rounded-full flex items-center justify-center">
                                        <span className="text-black font-bold text-xs">{getUsername(userEmail).charAt(0).toUpperCase()}</span>
                                    </div>
                                    <span className="text-sm text-gray-300">{getUsername(userEmail)}</span>
                                </div>
                                <LogoutButton />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-6">
                    <div className="max-w-full lg:max-w-6xl mx-auto">
                        {activeTab === 'vault' ? (
                            <VaultDisplay
                                userToken={token}
                                entries={entries}
                                setEntries={setEntries}
                                onEntriesLoaded={handleEntriesLoaded}
                            />
                        ) : activeTab === 'add' ? (
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-gradient-to-br from-black via-gray-900 to-gray-950 border border-[color:var(--neon)]/30 rounded-2xl p-6 lg:p-8 shadow-xl">
                                    <VaultForm userToken={token} onNewEntry={handleNewEntry} />
                                </div>
                            </div>
                        ) : activeTab === 'addkey' ? (
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-gradient-to-br from-black via-gray-900 to-gray-950 border border-[color:var(--neon)]/30 rounded-2xl p-6 lg:p-8 shadow-xl">
                                    <License userToken={token} onNewEntry={handleNewEntry} />
                                </div>
                            </div>
                        ) : activeTab === 'addnote' ? (
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-gradient-to-br from-black via-gray-900 to-gray-950 border border-[color:var(--neon)]/30 rounded-2xl p-6 lg:p-8 shadow-xl">
                                    <NoteForm userToken={token} onNewEntry={handleNewEntry} />
                                </div>
                            </div>
                        ) : activeTab === 'addapi' ? (
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-gradient-to-br from-black via-gray-900 to-gray-950 border border-[color:var(--neon)]/30 rounded-2xl p-6 lg:p-8 shadow-xl">
                                    <Api userToken={token} onNewEntry={handleNewEntry} />
                                </div>
                            </div>
                        ) : activeTab === 'pgen' ? (
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-gradient-to-br from-black via-gray-900 to-gray-950 rounded-2xl p-6 lg:p-8 shadow-xl">
                                    <GenerateStrongPassword />
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-6xl mx-auto">
                                <div className="rounded-2xl p-6 lg:p-8 shadow-xl">
                                    <PasswordChecker />
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}