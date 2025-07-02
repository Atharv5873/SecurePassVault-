'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { deriveKey } from '@/lib/crypto/deriveKey';
import { useCrypto } from '@/contexts/cryptocontext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setDerivedKey } = useCrypto();
    const router = useRouter();
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // safe to access Web Crypto API
        }
    }, []);
      

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            toast.dismiss();
            toast.loading('Logging in...');
            const formData = new URLSearchParams();
            formData.append('grant_type', 'password');
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch('/auth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            });

            const data = await res.json();
            toast.dismiss();

            if (!res.ok) {
                const errorMsg =
                    typeof data.detail === 'string'
                        ? data.detail
                        : Array.isArray(data.detail)
                            ? data.detail.map((d: { msg: string }) => d.msg).join(', ')
                            : data.message || 'Login failed';
                toast.error(errorMsg);
                return;
            }

            toast.success('Login successful!');
            toast.loading('Fetching salt...');


            // Only now fetch the salt
            const saltRes = await fetch(`/auth/salt?username=${encodeURIComponent(email)}`, {
                headers: {
                    Authorization: `Bearer ${data.access_token}`, // or data.token, depending on your backend response
                },
            });              
            const saltData = await saltRes.json();
            toast.dismiss();

            if (!saltRes.ok || !saltData.salt) {
                toast.error(saltData.detail || 'Could not fetch salt');
                return;
            }


            const salt = Uint8Array.from(atob(saltData.salt), c => c.charCodeAt(0));
            if (!window.crypto?.subtle) {
                toast.error("Your browser doesn't support secure encryption. Please use Chrome or Firefox.");
                return;
            }

            const key = await deriveKey(password, salt);
            
            setDerivedKey(key);

            if (!data.access_token) {
                toast.error('Token missing from server response');
                return;
            }

            sessionStorage.setItem('token', data.access_token); // Save it
            router.push('/vault');

            
        } catch (err) {
            toast.dismiss();
            console.error(err);
            toast.error('Unexpected error during login.');
        }
    };

    return (
        <main className="min-h-screen bg-slate-900 text-white px-4 py-16">
            <form
                onSubmit={handleLogin}
                className="max-w-md mx-auto bg-slate-800/80 p-8 rounded-xl space-y-6 shadow-xl border border-teal-500/20"
            >
                <h1 className="text-3xl font-bold text-center text-teal-400">Login</h1>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <input
                    type="password"
                    placeholder="Master Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <button
                    type="submit"
                    className="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded text-white font-semibold transition"
                >
                    Log In
                </button>
            </form>
        </main>
    );
}
