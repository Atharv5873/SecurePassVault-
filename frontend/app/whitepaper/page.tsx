'use client';

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

const WhitepaperPage = () => {
    return (
        <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            {/* Navigation */}
            <div className="relative z-10 p-6">
                <Link href="/" className="inline-flex items-center space-x-2 px-5 py-2 rounded-md font-semibold border border-[color:var(--neon)] text-[color:var(--neon)] bg-transparent hover:bg-[color:var(--neon)] hover:text-black transition-all duration-200 shadow">
                    <span>←</span>
                    <span>Back to Home</span>
                </Link>
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                            {/* First Row: SecurePass Vault and Cyber Cordon */}
                            <div className="grid lg:grid-cols-2 gap-16 mb-20">
                                
                    <div className="flex flex-col">
                        <div className="text-center h-48 flex items-center justify-center mb-6">
                            <Image
                                src="/logo.png.png"
                                alt="Cyber Cordon Logo"
                                width={280}
                                height={280}
                                className="object-contain"
                            />
                        </div>
                    </div>
                                {/* SecurePass Vault Section */}
                                <div className="flex flex-col">
                                    <div className="text-center h-48 flex items-center justify-center mb-6">
                                        <Image
                                            src="/applogo.png.png"
                                            alt="SecurePass Vault Logo"
                                            width={300}
                                            height={300}
                                            className="object-contain"
                                        />
                                    </div>
                                    </div>
                                    </div>
                                    </div>
        <div className="max-w-4xl mx-auto px-6 py-10 text-white">
            <h1 className="text-4xl font-bold mb-6">🔐 SecurePass Vault Whitepaper</h1>

            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-2">Overview</h2>
                <p className="text-gray-300">
                    SecurePass Vault is an end-to-end encrypted password and product key manager that ensures only you can access your sensitive data. We use modern cryptography, secure authentication protocols, and zero-knowledge principles to protect your credentials — even we cannot read them.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-2">Zero-Knowledge Authentication (SRP)</h2>
                <p className="text-gray-300 mb-2">
                    Our authentication mechanism is powered by the Secure Remote Password (SRP) protocol — a zero-knowledge proof system. This means:
                </p>
                <ul className="list-disc pl-6 text-gray-300">
                    <li>Your password is never sent to the server — not even hashed.</li>
                    <li>We store a one-time cryptographic verifier generated from your password and a random salt.</li>
                    <li>Login proves you know your password without revealing it.</li>
                    <li>No attacker (even us) can reverse-engineer your password from the verifier.</li>
                </ul>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-2">Encryption</h2>
                <p className="text-gray-300 mb-2">
                    After authentication, we derive a strong encryption key from your password and salt using PBKDF2 in the browser.
                </p>
                <ul className="list-disc pl-6 text-gray-300">
                    <li>Passwords and product keys are encrypted in the browser before being sent to the server.</li>
                    <li>We use AES-256-GCM for symmetric encryption, ensuring both confidentiality and integrity.</li>
                    <li>Decryption also happens only in the browser. The server stores only ciphertext.</li>
                </ul>
                <p className="text-gray-300 mt-2 italic">
                    This means even if our server is compromised, your data remains secure.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-2">Storage</h2>
                <p className="text-gray-300">
                    Encrypted credentials are stored in a secure MongoDB backend. Each record includes:
                </p>
                <ul className="list-disc pl-6 text-gray-300">
                    <li><strong>Site name</strong> and <strong>username</strong> (encrypted)</li>
                    <li><strong>Password or product key</strong> (encrypted)</li>
                    <li>Metadata such as timestamps and optional labels</li>
                </ul>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-2">Session Security</h2>
                <p className="text-gray-300">
                    After SRP login, we issue a short-lived access token. Encryption keys are stored securely in sessionStorage — never persisted or reused across devices.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-2">Your Privacy</h2>
                <p className="text-gray-300">
                    At Cyber Cordon, we believe in privacy by design. We do not:
                </p>
                <ul className="list-disc pl-6 text-gray-300">
                    <li>Log your master password</li>
                    <li>Store unencrypted data</li>
                    <li>Sell or share your data</li>
                </ul>
                <p className="text-gray-300 mt-2">
                    You are the only person who can decrypt your vault.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mb-2">Open Source Commitment</h2>
                <p className="text-gray-300">
                    Our codebase is open for peer review. We welcome contributions, audits, and transparency. Trust should be earned — and we believe security must be verifiable.
                </p>
            </section>

            <div className="mt-12 text-center text-gray-400 text-sm">
                Last updated: July 2025
            </div>
        </div>
        </main>
    );
};

export default WhitepaperPage;
