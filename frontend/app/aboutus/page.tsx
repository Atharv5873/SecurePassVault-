"use client";

import Image from "next/image";
import Link from "next/link";
import { Shield, Lock, Eye, Code, Users, Globe, Award, Zap } from 'lucide-react';

const devs = [
    {
        name: "Atharv Sharma",
        role: "Backend Engineer & Security Researcher",
        image: "/ath.jpg",
        linkedin: "https://www.linkedin.com/in/atharv-sharma-cybercordon/"
    },
    {
        name: "Vatanesh Sharma",
        role: "Full-Stack Developer & Ethical Hacker",
        image: "/vat.jpg",
        linkedin: "https://www.linkedin.com/in/vatanesh-sharma-cybercordon/"
    }
];

export default function AboutUsPage() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
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

            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* First Row: SecurePass Vault and Cyber Cordon */}
                <div className="grid lg:grid-cols-2 gap-16 mb-20">
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

                        <div className="space-y-6 text-center">
                            <p className="text-xl text-gray-300 leading-relaxed">
                                A zero-knowledge, developer-friendly password manager designed to keep your digital credentials safe — without ever compromising control or transparency.
                            </p>

                            <p className="text-lg text-gray-300 leading-relaxed">
                                Built by a team of cybersecurity and backend engineers, it combines simplicity with serious security, offering users the confidence to store and manage sensitive data with peace of mind.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-4 mt-8">
                            <h2 className="text-2xl font-bold neon-text mb-4">🔑 Key Features</h2>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <Shield className="w-5 h-5 text-[color:var(--neon)] mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Zero-Knowledge Architecture</h3>
                                        <p className="text-gray-300 text-sm">Your data is encrypted before it even leaves your device. Not even we can access your passwords — and that's by design.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Lock className="w-5 h-5 text-[color:var(--neon)] mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Two-Layer Encryption</h3>
                                        <p className="text-gray-300 text-sm">AES encryption is applied on both the frontend and backend, ensuring your credentials remain protected at every stage.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Eye className="w-5 h-5 text-[color:var(--neon)] mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Trustless by Design</h3>
                                        <p className="text-gray-300 text-sm">We can't read, retrieve, or misuse your data. Even if our systems were compromised, your secrets remain safe.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Code className="w-5 h-5 text-[color:var(--neon)] mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Developer-Centric</h3>
                                        <p className="text-gray-300 text-sm">From token-based authentication to secure credential management, designed for security-conscious developers.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-6">
                            <h3 className="text-xl font-bold neon-text">🧩 Your credentials. Your vault. Nobody else's business.</h3>
                        </div>
                    </div>

                    {/* Cyber Cordon Section */}
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

                        <div className="space-y-6 text-center">
                            <p className="text-xl text-gray-300 leading-relaxed">
                                A student-founded cybersecurity initiative focused on building secure, trustless tools and providing hands-on security services that make a real-world impact.
                            </p>

                            <p className="text-lg text-gray-300 leading-relaxed">
                                Started by two final-year engineering students after winning the prestigious HackathonX in our third year, Cyber Cordon was born out of a shared passion for backend development, ethical hacking, and solving real cybersecurity challenges.
                            </p>
                        </div>

                        {/* Services */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold neon-text mb-4">🔧 What We Do</h3>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <Shield className="w-5 h-5 text-[color:var(--neon)] mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-lg font-semibold text-white">Security Tools & Platforms</h4>
                                        <p className="text-gray-300 text-sm">Creators of SecurePass Vault — a zero-knowledge, two-layer encrypted password manager.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Zap className="w-5 h-5 text-[color:var(--neon)] mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-lg font-semibold text-white">Vulnerability & Bug Scanning</h4>
                                        <p className="text-gray-300 text-sm">In-depth vulnerability assessments and bug scans to identify critical security risks.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Code className="w-5 h-5 text-[color:var(--neon)] mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-lg font-semibold text-white">Detailed Security Reports</h4>
                                        <p className="text-gray-300 text-sm">Technical insights, risk breakdowns, and actionable recommendations to fortify your systems.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Lock className="w-5 h-5 text-[color:var(--neon)] mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-lg font-semibold text-white">Security-First Backend Engineering</h4>
                                        <p className="text-gray-300 text-sm">Building backend systems with trustless design principles and encryption.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Users className="w-5 h-5 text-[color:var(--neon)] mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-lg font-semibold text-white">Cybersecurity Awareness</h4>
                                        <p className="text-gray-300 text-sm">Building a security-aware community through educational content across India.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Award className="w-5 h-5 text-[color:var(--neon)] mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-lg font-semibold text-white">HackathonX Winners</h4>
                                        <p className="text-gray-300 text-sm">Started by two final-year engineering students after winning the prestigious HackathonX.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mission Section - Centered */}
                <div className="text-center mb-20">
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-3xl font-bold neon-text mb-6">🌍 Our Mission</h3>
                        <p className="text-xl text-gray-300 leading-relaxed mb-6">
                            Focusing on trust, security, and clarity, Cyber Cordon is committed to empowering individuals, developers, and businesses to build safer digital systems. We're contributing to a more resilient, secure India — one bug fix, one product, and one breakthrough at a time.
                        </p>
                        <h4 className="text-2xl font-bold neon-text">
                            Cyber Cordon — Empowering Security for a Safer India
                        </h4>
                    </div>
                </div>

                {/* Second Row: Meet the Devs */}
                <div className="text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-12 neon-text">
                        Meet Our Devs
                    </h2>
                    <div className="flex flex-col md:flex-row gap-12 items-center justify-center w-full max-w-6xl z-10">
                        {devs.map((dev) => (
                            <div key={dev.name} className="backdrop-blur-xl bg-white/5 border border-[color:var(--neon)]/60 shadow-2xl rounded-3xl p-12 flex flex-col items-center w-full max-w-md min-w-[320px] transition-transform hover:scale-105 hover:shadow-[0_0_40px_10px_var(--neon)]">
                                <div className="w-48 h-48 mb-6 rounded-full overflow-hidden border-8 border-[color:var(--neon)] shadow-lg">
                                    <Image src={dev.image} alt={dev.name} width={192} height={192} className="object-cover w-full h-full" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2 drop-shadow">{dev.name}</h3>
                                <p className="text-lg text-[color:var(--neon)] font-semibold mb-4 uppercase tracking-wide">{dev.role}</p>
                                <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-3 rounded-lg font-bold bg-[color:var(--neon)] text-black text-lg shadow hover:bg-blue-400 transition-all duration-200 mt-2">
                                    LinkedIn Profile
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
} 