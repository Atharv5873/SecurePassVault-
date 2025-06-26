'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import VaultForm from '@/components/vaultform';
import VaultDisplay from '@/components/VaultDisplay';
import LogoutButton from '@/components/logoutbutton';
import type { VaultEntry } from '../types/vault';



export default function VaultPage() {
    const [token, setToken] = useState<string | null>(null);
    const [entries, setEntries] = useState<VaultEntry[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const savedToken = sessionStorage.getItem('token');
        if (!savedToken) {
            router.replace('/login');
        } else {
            setToken(savedToken);
        }
    }, []);
    

    const handleNewEntry = (newEntry: VaultEntry) => {
        setEntries((prev) => [...prev, newEntry]);
    };

    if (!token) return <p className="text-red-500 text-center">Unauthorized</p>;

    return (
        <main className="min-h-screen py-12 px-4 bg-slate-900 text-teal-400">
            <h1 className="text-3xl font-bold text-center mb-8">My Secure Vault</h1>
            <div className="flex justify-between items-center mb-6">
                <LogoutButton />
                </div>
            <VaultForm userToken={token} onNewEntry={handleNewEntry} />
            <VaultDisplay userToken={token} entries={entries} setEntries={setEntries} />
        </main>
    );
}
