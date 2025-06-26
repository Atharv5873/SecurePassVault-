'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Hero */}
      <section className="text-center px-6 py-24 bg-gradient-to-b from-slate-900 to-slate-950">
        <h1 className="text-4xl sm:text-5xl font-bold text-teal-400 mb-4">Secure Pass-Vault</h1>
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-300">
          The safest place to store your passwords — with zero-knowledge architecture & two-layer encryption.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-6 py-3 rounded-lg shadow"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-6 py-3 rounded-lg shadow"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-slate-800 rounded-xl border border-teal-600/30 shadow">
            <h3 className="text-xl font-semibold text-teal-300 mb-2">Zero-Knowledge Architecture</h3>
            <p className="text-slate-300 text-sm">
              Your data is encrypted before it even leaves your device. Not even we can see your passwords.
            </p>
          </div>
          <div className="p-6 bg-slate-800 rounded-xl border border-teal-600/30 shadow">
            <h3 className="text-xl font-semibold text-teal-300 mb-2">Two-Layer Encryption</h3>
            <p className="text-slate-300 text-sm">
              AES encryption on the frontend and backend ensures your credentials are secure — twice.
            </p>
          </div>
          <div className="p-6 bg-slate-800 rounded-xl border border-teal-600/30 shadow">
            <h3 className="text-xl font-semibold text-teal-300 mb-2">Trustless by Design</h3>
            <p className="text-slate-300 text-sm">
              Designed with security-first principles — we can't read, retrieve, or misuse your data.
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 px-6 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-teal-400">About Cyber Cordon</h2>
          <p className="text-slate-300 text-lg">
            Cyber Cordon is dedicated to building transparent, privacy-respecting cyber solutions. This vault is
            built using modern cryptography, two-layer encryption, and an uncompromising zero-knowledge design.
          </p>
          <p className="text-slate-400 text-sm">
            Visit our site at{' '}
            <a
              href="https://cybercordon.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:underline"
            >
              cybercordon.vercel.app
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 bg-slate-900 text-center text-sm text-slate-500 border-t border-slate-800">
        © {new Date().getFullYear()} Cyber Cordon. All rights reserved.
      </footer>
    </main>
  );
}
