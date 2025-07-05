'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { encryptData } from '@/lib/crypto/encryptdata';
import { useCrypto } from '@/contexts/cryptocontext';
import { NoteEntry } from '@/app/types/vault';
import { Text, Eye, EyeOff, StickyNote, Lock } from 'lucide-react';

type NoteFormProps = {
    userToken: string;
    onNewEntry: (entry: NoteEntry) => void;
};

export default function NoteForm({ userToken, onNewEntry }: NoteFormProps) {
    const { derivedKey } = useCrypto();
    const [form, setForm] = useState({ title: '', content: '' });
    const [showPassword, setShowPassword] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!derivedKey) {
            toast.error('Encryption key not available. Login again.');
            return;
        }

        const { title, content } = form;
        if (!title || !content) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            toast.loading('Encrypting and saving...');
            const encryptedPassword = await encryptData(derivedKey, content);
            toast.dismiss();

            const res = await fetch('https://securepassvault-1.onrender.com/notes/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({ title, content: encryptedPassword }),
            });

            const saved = await res.json();
            if (!res.ok) throw new Error('Save failed');

            onNewEntry({
                id: saved.id,
                title
            });
            toast.success('Content saved securely!');
            setForm({ title: '', content: '' });
            setShowPassword(true);
        } catch (err) {
            toast.dismiss();
            toast.error('Failed to save content');
            console.error(err);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold neon-text mb-2">Add New Entry</h1>
                <p className="text-gray-400 text-sm">Create a new encrypted note entry</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 ">
                {/* Title Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        Title
                    </label>
                    <div className="relative">
                        <input
                            className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-[color:var(--neon)]/30 text-white placeholder-gray-400 focus:outline-none focus:border-[color:var(--neon)]/60 focus:ring-1 focus:ring-[color:var(--neon)]/30 transition-all duration-200"
                            placeholder="e.g. My Secret Recipe"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                        />
                        <StickyNote size={18} className="absolute left-4 top-4 text-gray-400" />
                    </div>
                </div>

            

                {/* Content Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        Content
                    </label>
                    <div className="relative">
                        {showPassword ? (
                            <textarea
                                rows={6}
                                className="w-full px-4 py-3 pl-12 pr-12 rounded-xl bg-white/5 border border-[color:var(--neon)]/30 text-white placeholder-gray-400 focus:outline-none focus:border-[color:var(--neon)]/60 focus:ring-1 focus:ring-[color:var(--neon)]/30 transition-all duration-200 resize-y"
                                placeholder="Enter your content"
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                required
                            />
                        ) : (
                            <input
                                type="password"
                                className="w-full px-4 py-3 pl-12 pr-12 rounded-xl bg-white/5 border border-[color:var(--neon)]/30 text-white placeholder-gray-400 focus:outline-none focus:border-[color:var(--neon)]/60 focus:ring-1 focus:ring-[color:var(--neon)]/30 transition-all duration-200"
                                placeholder="Enter your content"
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                required
                            />
                        )}
                        <Text size={18} className="absolute left-4 top-4 text-gray-400" />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-[color:var(--neon)] transition-colors"
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
                        Save Note Securely
                    </div>
                </button>
            </form>

            {/* Security Note */}
            <div className="mt-6 p-4 rounded-xl bg-[color:var(--neon)]/10 border border-[color:var(--neon)]/20">
                <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[color:var(--neon)] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                        <p className="text-sm text-gray-300">
                            <span className="font-medium text-[color:var(--neon)]">Security Note:</span> Your note's content is encrypted before being sent to our servers. We cannot see or access your actual content.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
