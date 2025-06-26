export const API_BASE = '/api';

export async function register(data: { email: string; password: string }) {
    return fetch(`${API_BASE}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data)
    });
}

export async function login(data: { email: string; password: string }) {
    return fetch(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data)
    });
}

export async function logout() {
    return fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
}

export async function getEncryptedPasswords() {
    const res = await fetch(`${API_BASE}/vault`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
}

export async function savePassword(data: any) {
    return fetch(`${API_BASE}/vault`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data)
    });
}

export async function deletePassword(id: string) {
    return fetch(`${API_BASE}/vault/${id}`, { method: 'DELETE', credentials: 'include' });
}