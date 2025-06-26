'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';


export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        toast.dismiss();

        try {
            // Generate random salt
            const salt = new Uint8Array(16);
            crypto.getRandomValues(salt);
            const saltB64 = btoa(String.fromCharCode(...salt));

            const res = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: email,
                    password,
                    salt: saltB64,
                }),
            });

            const data = await res.json();
            setLoading(false);

            if (!res.ok) {
                toast.error(data.detail || 'Registration failed');
                return;
            }

            toast.success('Registration successful!');
            router.push('/login');
        } catch (err) {
            setLoading(false);
            toast.error('Unexpected error occurred');
            console.error(err);
        }
    };

    return (
        <main className="min-h-screen bg-slate-900 text-white px-4 py-16">
            <form
                onSubmit={handleRegister}
                className="max-w-md mx-auto bg-slate-800/80 p-8 rounded-xl space-y-6 shadow-xl border border-teal-500/20"
            >
                <h1 className="text-3xl font-bold text-center text-teal-400">Register</h1>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <input
                    type="password"
                    placeholder="Master Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <button
                    type="submit"
                    className="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded text-white font-semibold transition"
                    disabled={loading}
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
        </main>
    );
}
