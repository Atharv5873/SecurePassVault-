import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as srp from 'secure-remote-password/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const pingServer = async () => {
  try {
    const res = await fetch(process.env.BASE_API_URL || '', {
      method: 'GET',
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('Ping failed');
    console.log('[Pinger] Server is up');
  } catch (err) {
    console.error('[Pinger] Error pinging server:', err);
  }
};


export async function generateSrpRegistration(username: string, password: string) {
  const salt = srp.generateSalt();
  const privateKey = srp.derivePrivateKey(salt, username, password);
  const verifier = srp.deriveVerifier(privateKey);
  return {
    salt: Buffer.from(salt).toString('hex'),
    verifier: Buffer.from(verifier).toString('hex')
  };
}

export async function createSrpSession(username: string, password: string, saltHex: string, BHex: string) {
  const salt = Buffer.from(saltHex, 'hex');
  const B = Buffer.from(BHex, 'hex');
  const a = srp.generateEphemeral();

  const privateKey = srp.derivePrivateKey(salt.toString('hex'), username, password);
  const session = srp.deriveSession(a.secret, a.public, salt.toString('hex'), password, B.toString('hex'));
  return {
    A: Buffer.from(a.public).toString('hex'),
    M1: Buffer.from(session.proof).toString('hex'),
    sessionKey: session.key
  };
}
