'use client';

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

const WhyUs = () => {
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
        <div className="min-h-screen px-6 py-10 md:px-20 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center text-[color:var(--neon)]">
                Why SecurePass Vault?
            </h1>

            <div className="max-w-5xl mx-auto space-y-10">
                <section>
                    <h2 className="text-2xl font-semibold text-teal-400 mb-2">🔐 True Zero-Knowledge Authentication</h2>
                    <p className="text-gray-300">
                        Unlike Google or browser-based managers, SecurePass Vault never sees or stores your actual password.
                        We use the Secure Remote Password (SRP) protocol which means **authentication happens without sending plaintext** to the server—making it immune to leaks or breaches.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-teal-400 mb-2">🧠 You&apos;re in Control</h2>
                    <p className="text-gray-300">
                        Browser managers often sync credentials across devices and cloud services automatically. While convenient, this also means they&apos;re vulnerable if your Google account or browser is compromised.
                        SecurePass Vault puts **you in full control**, without automatic syncing or exposure to third-party services.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-teal-400 mb-2">💼 Multi-Use Credential Vault</h2>
                    <p className="text-gray-300">
                        Store not just passwords, but also product keys, license tokens, and secrets—organized under one encrypted vault. Traditional managers usually limit to just logins.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-teal-400 mb-2">🌐 Fully Open Source</h2>
                    <p className="text-gray-300">
                        Trust through transparency. Our frontend and backend code is open source and auditable. No hidden tracking, telemetry, or ad-based data collection.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-teal-400 mb-2">💥 Lightweight & Fast</h2>
                    <p className="text-gray-300">
                        SecurePass Vault is built using modern frameworks with no bloated dependencies. It loads fast, works offline-first, and uses **client-side decryption** to keep your data local and secure.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-teal-400 mb-2">🚫 No Lock-in</h2>
                    <p className="text-gray-300">
                        With SecurePass Vault, you&apos;re not tied to a provider. You can export your vault at any time and even host the app yourself if you choose.
                    </p>
                </section>
            </div>
        </div>
            </main>
    );
};

export default WhyUs;
