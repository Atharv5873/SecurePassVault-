'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { encryptData } from '@/lib/crypto/encryptdata';
import { useCrypto } from '@/contexts/cryptocontext';


type VaultFormProps = {
    userToken: string;
    onNewEntry: (entry: any) => void;
};

export default function VaultForm({ userToken, onNewEntry }: VaultFormProps) {
    const { derivedKey } = useCrypto();
    const [form, setForm] = useState({ site: '', username: '', password: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!derivedKey) {
            toast.error('Encryption key not available. Login again.');
            return;
        }

        const { site, username, password } = form;
        if (!site || !username || !password) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            toast.loading('Encrypting...');
            const encryptedPassword = await encryptData(derivedKey, password);
            toast.dismiss();

            const res = await fetch('https://securepassvault-1.onrender.com/credentials/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({ site, username, password: encryptedPassword }),
            });

            const saved = await res.json();
            if (!res.ok) throw new Error('Save failed');

            onNewEntry({
                id: saved.id,
                site,
                username
            });
             // update vault instantly
            toast.success('Password saved!');
            setForm({ site: '', username: '', password: '' });
        } catch (err) {
            toast.dismiss();
            toast.error('Failed to save password');
            console.error(err);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl mx-auto px-4 py-8 bg-slate-800/60 rounded-2xl shadow-lg space-y-6 border border-slate-600"
        >
            <div>
                <label className="block mb-2 text-sm sm:text-base font-medium text-teal-300">Website</label>
                <input
                    className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. GitHub"
                    value={form.site}
                    onChange={(e) => setForm({ ...form, site: e.target.value })}
                    required
                />
            </div>
            <div>
                <label className="block mb-2 text-sm sm:text-base font-medium text-teal-300">Username</label>
                <input
                    className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="smartcoder123"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                />
            </div>
            <div>
                <label className="block mb-2 text-sm sm:text-base font-medium text-teal-300">Password</label>
                <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                />
            </div>
            <button
                type="submit"
                className="w-full py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-base transition-colors"
            >
                Save Password
            </button>
        </form>
    );
    
}
