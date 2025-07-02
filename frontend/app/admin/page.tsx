'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Trash2, Edit, Users, Shield, LogOut } from 'lucide-react';

interface User {
    id: string;
    email: string;
    is_admin: boolean;
}

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [newEmail, setNewEmail] = useState('');
    const router = useRouter();

    const checkAdminAccess = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        try {
            const res = await fetch('/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                router.push('/');
                return;
            }

            const userData = await res.json();

            if (!userData.is_admin) {
                toast.error('Admin access required');
                router.push('/vault');
                return;
            }

        } catch (err) {
            console.error('Error checking admin access:', err);
            router.push('/');
        }
    }, [router]);

    useEffect(() => {
        checkAdminAccess();
        fetchUsers();
    }, [checkAdminAccess]);

    const fetchUsers = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('/admin/users', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                toast.error('Failed to fetch users');
            }
        } catch {
            toast.error('Error fetching users');
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId: string) => {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`/admin/user/${userId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                toast.success('User deleted successfully');
                fetchUsers();
            } else {
                const data = await res.json();
                toast.error(data.detail || 'Failed to delete user');
            }
        } catch {
            toast.error('Error deleting user');
        }
    };

    const startEdit = (user: User) => {
        setEditingUser(user.id);
        setNewEmail(user.email);
    };

    const saveEdit = async (userId: string) => {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`/admin/rename/${userId}?new_email=${encodeURIComponent(newEmail)}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                toast.success('User renamed successfully');
                setEditingUser(null);
                fetchUsers();
            } else {
                const data = await res.json();
                toast.error(data.detail || 'Failed to rename user');
            }
        } catch {
            toast.error('Error renaming user');
        }
    };

    const cancelEdit = () => {
        setEditingUser(null);
        setNewEmail('');
    };

    const handleLogout = () => {
        sessionStorage.clear();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-[color:var(--neon)] text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="bg-[#181c1b] border-b border-[color:var(--neon)]/30 p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[color:var(--neon)] rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold neon-text">Admin Panel</h1>
                            <p className="text-gray-400 text-sm">Manage SecurePass Vault users</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-gray-400">
                            <Users className="w-5 h-5" />
                            <span>{users.length} Users</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-[#181c1b] border border-[color:var(--neon)]/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold neon-text">User Management</h2>
                        <button
                            onClick={fetchUsers}
                            className="px-4 py-2 bg-[color:var(--neon)] text-black font-semibold rounded-lg hover:bg-blue-400 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>

                    <div className="space-y-4">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="bg-[#0f1211] border border-[color:var(--neon)]/20 rounded-xl p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-[color:var(--neon)]/20 rounded-lg flex items-center justify-center">
                                        <span className="text-[color:var(--neon)] font-bold">
                                            {user.email.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        {editingUser === user.id ? (
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="email"
                                                    value={newEmail}
                                                    onChange={(e) => setNewEmail(e.target.value)}
                                                    className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white focus:border-[color:var(--neon)] focus:outline-none"
                                                />
                                                <button
                                                    onClick={() => saveEdit(user.id)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-medium">{user.email}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    {user.is_admin && (
                                                        <span className="px-2 py-1 bg-[color:var(--neon)] text-black text-xs font-bold rounded">
                                                            ADMIN
                                                        </span>
                                                    )}
                                                    <span className="text-gray-400 text-sm">ID: {user.id}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {editingUser !== user.id && (
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => startEdit(user)}
                                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                            title="Edit user"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                            title="Delete user"
                                            disabled={user.is_admin}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {users.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No users found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 