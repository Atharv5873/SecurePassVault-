'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { encryptData } from '@/lib/crypto/encryptdata';
import { useCrypto } from '@/contexts/cryptocontext';
import { ApiEntry } from '@/app/types/vault';
import { Lock, Globe, Eye, EyeOff, LetterText } from 'lucide-react';

type ApiProps = {
    userToken: string;
    onNewEntry: (entry: ApiEntry) => void;
};

export default function Api({ userToken, onNewEntry }: ApiProps) {
    const { derivedKey } = useCrypto();
    const [form, setForm] = useState({ serviceName: '', apiKey: '', description: '' });
    const [showApiKey, setShowApiKey] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!derivedKey) {
            toast.error('Encryption key not available. Login again.');
            return;
        }

        const { description, serviceName, apiKey } = form;
        if (!serviceName) return toast.error('Service name is required');
        if (!apiKey) return toast.error('Api key is required');

        try {
            setLoading(true);
            toast.loading('Encrypting and saving...');
            const encryptedApiKey = await encryptData(derivedKey, apiKey);
            toast.dismiss();

            const res = await fetch('https://securepassvault-1.onrender.com/api-keys/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({
                    service_name: serviceName,
                    api_key: encryptedApiKey,
                    ...(description && { description }), // only include if non-empty
                }),
            });

            const saved = await res.json();
            if (!res.ok) throw new Error('Save failed');

            onNewEntry({
                id: saved.id,
                service_name: serviceName,
                description,
            });

            toast.success('Api key saved securely!');
            setForm({ serviceName: '', apiKey: '', description: '' });
            setShowApiKey(false);
        } catch (err) {
            toast.dismiss();
            toast.error('Failed to save api key');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold neon-text mb-2">Add New Entry</h1>
                <p className="text-gray-400 text-sm">Create a new secure api key entry</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Name Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        Service Name
                    </label>
                    <div className="relative">
                        <input
                            className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-[color:var(--neon)]/30 text-white placeholder-gray-400 focus:outline-none focus:border-[color:var(--neon)]/60 focus:ring-1 focus:ring-[color:var(--neon)]/30 transition-all duration-200"
                            placeholder="e.g. OpenAI, GitHub, etc."
                            value={form.serviceName}
                            onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
                            required
                        />
                        <Globe size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {/* Api Key Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        Api Key
                    </label>
                    <div className="relative">
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            className="w-full px-4 py-3 pl-12 pr-12 rounded-xl bg-white/5 border border-[color:var(--neon)]/30 text-white placeholder-gray-400 focus:outline-none focus:border-[color:var(--neon)]/60 focus:ring-1 focus:ring-[color:var(--neon)]/30 transition-all duration-200"
                            placeholder="Enter your api key"
                            value={form.apiKey}
                            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                            required
                        />
                        <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[color:var(--neon)] transition-colors"
                        >
                            {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        Description (optional)
                    </label>
                    <div className="relative">
                        <input
                            className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-[color:var(--neon)]/30 text-white placeholder-gray-400 focus:outline-none focus:border-[color:var(--neon)]/60 focus:ring-1 focus:ring-[color:var(--neon)]/30 transition-all duration-200"
                            placeholder="eg. Using for chatbot integration"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                        <LetterText size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] focus:outline-none focus:ring-2 ${loading
                        ? 'bg-gray-500 cursor-not-allowed text-white'
                        : 'bg-[color:var(--neon)] text-black hover:bg-blue-400 focus:ring-[color:var(--neon)]/50'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Lock size={20} />
                        {loading ? 'Saving...' : 'Save Api Key Securely'}
                    </div>
                </button>
            </form>

            {/* Security Note */}
            <div className="mt-6 p-4 rounded-xl bg-[color:var(--neon)]/10 border border-[color:var(--neon)]/20">
                <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[color:var(--neon)] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                        <p className="text-sm text-gray-300">
                            <span className="font-medium text-[color:var(--neon)]">Security Note:</span> Your api key is encrypted before being sent to our servers. We cannot see or access your actual api keys.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
