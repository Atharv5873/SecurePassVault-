'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { encryptData } from '@/lib/crypto/encryptdata';
import { useCrypto } from '@/contexts/cryptocontext';
import { VaultEntry } from '@/app/types/vault';
import { Lock, User, Globe, Eye, EyeOff } from 'lucide-react';

type VaultFormProps = {
    userToken: string;
    onNewEntry: (entry: VaultEntry) => void;
};

export default function VaultForm({ userToken, onNewEntry }: VaultFormProps) {
    const { derivedKey } = useCrypto();
    const [form, setForm] = useState({ site: '', username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

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
            toast.loading('Encrypting and saving...');
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
            toast.success('Password saved securely!');
            setForm({ site: '', username: '', password: '' });
            setShowPassword(false);
        } catch (err) {
            toast.dismiss();
            toast.error('Failed to save password');
            console.error(err);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold neon-text mb-2">Add New Entry</h2>
                <p className="text-gray-400 text-sm">Create a new secure password entry</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Website Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Globe size={16} />
                        Website
                    </label>
                    <div className="relative">
                        <input
                            className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-[color:var(--neon)]/30 text-white placeholder-gray-400 focus:outline-none focus:border-[color:var(--neon)]/60 focus:ring-1 focus:ring-[color:var(--neon)]/30 transition-all duration-200"
                            placeholder="e.g. GitHub, Google, Facebook"
                            value={form.site}
                            onChange={(e) => setForm({ ...form, site: e.target.value })}
                            required
                        />
                        <Globe size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        <User size={16} />
                        Username
                    </label>
                    <div className="relative">
                        <input
                            className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-[color:var(--neon)]/30 text-white placeholder-gray-400 focus:outline-none focus:border-[color:var(--neon)]/60 focus:ring-1 focus:ring-[color:var(--neon)]/30 transition-all duration-200"
                            placeholder="Enter your username or email"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                        />
                        <User size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Lock size={16} />
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full px-4 py-3 pl-12 pr-12 rounded-xl bg-white/5 border border-[color:var(--neon)]/30 text-white placeholder-gray-400 focus:outline-none focus:border-[color:var(--neon)]/60 focus:ring-1 focus:ring-[color:var(--neon)]/30 transition-all duration-200"
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                        <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[color:var(--neon)] transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full py-4 px-6 rounded-xl bg-[color:var(--neon)] text-black font-semibold text-lg hover:bg-blue-400 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[color:var(--neon)]/50"
                >
                    <div className="flex items-center justify-center gap-2">
                        <Lock size={20} />
                        Save Password Securely
                    </div>
                </button>
            </form>

            {/* Security Note */}
            <div className="mt-6 p-4 rounded-xl bg-[color:var(--neon)]/10 border border-[color:var(--neon)]/20">
                <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[color:var(--neon)] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                        <p className="text-sm text-gray-300">
                            <span className="font-medium text-[color:var(--neon)]">Security Note:</span> Your password is encrypted before being sent to our servers. We cannot see or access your actual passwords.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
