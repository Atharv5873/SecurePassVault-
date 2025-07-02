import toast from 'react-hot-toast';
import { generateSalt, encodeSalt, decodeSalt } from '@/lib/crypto/salt';
import { deriveKey } from '@/lib/crypto/deriveKey';
import { Dispatch, SetStateAction } from 'react';

export async function register(email: string, password: string) {
    // Show a loading toast and keep reference to dismiss later
    const loadingToast = toast.loading('Registering...');

    try {
        // Generate per-user salt and encode it for transport
        const salt = generateSalt();
        const encodedSalt = encodeSalt(salt);

        // Send registration request to backend
        const res = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password, salt: encodedSalt }),
        });

        if (res.ok) {
            toast.success('Account created!');
        } else {
            const error = await res.text();
            toast.error(`Registration failed: ${error}`);
        }
    } catch (err) {
        console.error('Registration error:', err);
        toast.error('Unexpected error occurred.');
    } finally {
        toast.dismiss(loadingToast);
    }
}


export async function login(
    email: string,
    password: string,
    setDerivedKey: Dispatch<SetStateAction<CryptoKey | null>>
) {
    const loadingToast = toast.loading('Logging in...');

    try {
        // 1. Get user-specific salt from backend
        const saltRes = await fetch(`/auth/salt?email=${encodeURIComponent(email)}`);
        if (!saltRes.ok) {
            toast.error('Failed to fetch salt');
            return;
        }
        const { salt: encodedSalt } = await saltRes.json();
        const salt = decodeSalt(encodedSalt);

        // 2. Derive key using user's password + salt
        const key = await deriveKey(password, salt);

        // 3. Authenticate with backend
        const res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password }),
        });

        if (!res.ok) {
            toast.error('Login failed');
            return;
        }


        // 5. Store derived key in context
        setDerivedKey(key);

        toast.success('Logged in successfully!');
    } catch (err) {
        console.error('Login error:', err);
        toast.error('Unexpected error occurred.');
    } finally {
        toast.dismiss(loadingToast);
    }
}

export async function logout() {

        toast.success('Logged out successfully');
  }

