import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const pingServer = async () => {
  try {
    const res = await fetch('https://securepassvault-1.onrender.com', {
      method: 'GET',
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`[Pinger] Ping failed. Status: ${res.status}`);
      throw new Error(`Ping failed with status ${res.status}`);
    }

    console.log(`[Pinger] Server is up!`);
  } catch (err) {
    console.error('[Pinger] Error pinging server:', err);
  }
};