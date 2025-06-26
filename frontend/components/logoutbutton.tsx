'use client';
import { useRouter } from 'next/navigation';
import { useCrypto } from '@/contexts/cryptocontext';
import { logout } from '@/lib/auth';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
    const router = useRouter();
    const { clearDerivedKey } = useCrypto();

    const handleLogout = async () => {
        await logout();
        clearDerivedKey();
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('salt');
        router.push('/');
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-400 hover:text-white hover:bg-red-500 rounded-md transition"
        >
            <LogOut size={18} /> Logout
        </button>
    );
}
