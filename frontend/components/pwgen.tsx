'use client';

import { useState } from 'react';
import { WandSparkles, Copy, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GenerateStrongPassword() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const generatePassword = async () => {
        setLoading(true);
        try {
            const res = await fetch('https://securepassvault-1.onrender.com/utils/generate-strong-password');
            if (!res.ok) throw new Error('Failed to fetch password');
            const data = await res.json();
            setPassword(data.password);
            toast.success('Password generated!');
        } catch (err) {
            console.error('[Password Gen Error]', err);
            toast.error('Could not generate password.');
        } finally {
            setLoading(false);
        }
    };

    const copyPassword = () => {
        if (!password) return toast.error('Nothing to copy');
        navigator.clipboard.writeText(password);
        toast.success('Copied to clipboard!');
    };

    return (
        <div className="bg-white/5 p-6 rounded-xl shadow-lg text-white max-w-xl mx-auto mt-10 border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <WandSparkles className="w-5 h-5 text-[color:var(--neon)]" />
                    Generate Strong Password
                </h2>
                <button
                    onClick={generatePassword}
                    disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm"
                >
                    <RefreshCcw className="w-4 h-4" />
                    {loading ? 'Generating...' : 'Generate'}
                </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
                Click the generate button to create a strong password that includes uppercase letters,
                lowercase letters, numbers, and special characters. Copy it and use it anywhere!
            </p>

            <div className="flex items-center gap-3">
                <input
                    readOnly
                    value={password}
                    placeholder="Your strong password will appear here..."
                    className="flex-1 px-4 py-2 rounded bg-black/40 border border-white/20 text-white placeholder-gray-500"
                />
                <button
                    onClick={copyPassword}
                    className="p-2 rounded bg-white/10 hover:bg-white/20"
                    title="Copy Password"
                >
                    <Copy className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
