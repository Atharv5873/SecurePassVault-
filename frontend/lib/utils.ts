import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const pingServer = async () => {
  try {
    const res = await fetch(process.env.BASE_API_URL || 'https://securepassvault-1.onrender.com', {
      method: 'GET',
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('Ping failed');
    console.log('[Pinger] Server is up');
  } catch (err) {
    console.error('[Pinger] Error pinging server:', err);
  }
};