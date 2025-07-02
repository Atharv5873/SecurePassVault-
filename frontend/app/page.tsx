'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCrypto } from '@/contexts/cryptocontext';
import { deriveKey } from '@/lib/crypto/deriveKey';
import { generateSalt, encodeSalt } from '@/lib/crypto/salt';
import { encryptText } from '@/lib/crypto/encrypt';
import Image from 'next/image';
import Link from "next/link";

export default function Home() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const router = useRouter();
  const { setDerivedKey } = useCrypto();

  useEffect(() => {
    fetch(`/admin/user-count`)
      .then((res) => res.json())
      .then((data) => setUserCount(data.total_users))
      .catch(() => setUserCount(null));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast.dismiss();
      toast.loading('Logging in...');

      const formData = new URLSearchParams();
      formData.append('grant_type', 'password');
      formData.append('username', loginEmail);
      formData.append('password', loginPassword);

      const res = await fetch('/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = await res.json();
      toast.dismiss();

      if (!res.ok) {
        const errorMsg = typeof data.detail === 'string' ? data.detail : Array.isArray(data.detail) ? data.detail.map((d: { msg: string }) => d.msg).join(', ') : data.message || 'Login failed';
        toast.error(errorMsg);
        return;
      }

      toast.success('Login successful!');
      toast.loading('Fetching salt...');

      const saltRes = await fetch(`/auth/salt?username=${encodeURIComponent(loginEmail)}`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const saltData = await saltRes.json();
      toast.dismiss();

      if (!saltRes.ok || !saltData.salt) {
        toast.error(saltData.detail || 'Could not fetch salt');
        return;
      }

      const salt = Uint8Array.from(atob(saltData.salt), c => c.charCodeAt(0));
      const key = await deriveKey(loginPassword, salt);
      const sessionKey = crypto.randomUUID();

      sessionStorage.setItem('token', data.access_token);
      sessionStorage.setItem('salt', saltData.salt);
      sessionStorage.setItem('vault-password', encryptText(loginPassword, sessionKey));
      sessionStorage.setItem('user-email', loginEmail);

      setDerivedKey(key);

      const meRes = await fetch('/auth/me', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      setShowLoginModal(false);
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.is_admin) router.push('/admin');
        else router.push('/vault');
      } else {
        router.push('/vault');
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error('Unexpected error during login.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerPassword !== registerConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      toast.dismiss();
      toast.loading('Creating account...');

      const salt = generateSalt();
      const encodedSalt = encodeSalt(salt);

      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerEmail,
          password: registerPassword,
          salt: encodedSalt,
        }),
      });

      const data = await res.json();
      toast.dismiss();

      if (!res.ok) {
        const errorMsg = typeof data.detail === 'string' ? data.detail : Array.isArray(data.detail) ? data.detail.map((d: { msg: string }) => d.msg).join(', ') : data.message || 'Registration failed';
        toast.error(errorMsg);
        return;
      }

      toast.success('Registration successful! Please login.');
      setShowRegisterModal(false);
      setShowLoginModal(true);
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error('Unexpected error during registration.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* Left Panel */}
      <section className="split-left flex flex-col justify-between p-6 lg:p-12 w-full lg:max-w-[480px] min-h-screen lg:min-h-screen text-center">
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-8">
            <span>© 2025 • A product by Cyber Cordon</span>
            <span>ver 2.0.1</span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold lg:text-4xl mb-4" style={{ letterSpacing: '0.01em' }}>Vault so seure that even Gru can&apos;t break in</div>
          <div className="accent-line" />
          <div className="mb-6 lg:mb-8">
            <Image
              src="/gru.gif"
              alt="Animated Art"
              width={400}
              height={300}
              className="object-contain w-full max-w-sm lg:max-w-md"
              priority
            />
          </div>
          {/* About Us Button */}
          <div className="mb-6 lg:mb-8 flex flex-col items-center gap-3">
            <a
              href="https://cybercordon.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md font-semibold text-black border  border-[#e0ffe0] bg-[#e0ffe0] hover:bg-teal-900 hover:border-teal-900 hover:text-[#e0ffe0] transition-all duration-200 text-center w-full max-w-[150px]"
            >
              VAPT Services
            </a>
            <Link
              href="/aboutus"
              className="px-3 py-1.5 rounded-md font-semibold text-black border border-[#e0ffe0] bg-[#e0ffe0] hover:bg-teal-900 hover:border-teal-900 hover:text-[#e0ffe0] transition-all duration-200 text-center w-full max-w-[150px]"
            >
              About Us
            </Link>
          </div>
        </div>
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">USERS ON BOARD</div>
          <span className="stat-number">{userCount !== null ? userCount : "-"}</span>
        </div>
      </section>
      {/* Right Panel */}
      <section className="split-right flex-1 flex flex-col items-center justify-start relative min-h-screen lg:min-h-screen overflow-hidden p-6 lg:p-0">
        {/* Animated Shield Outline */}
        {/* Centered Logo, larger, no background */}
        <div className="relative z-10 flex flex-col items-center pt-0 lg:pt-0 mt-18">
          <Image
            src="/applogo.png.png"
            alt="SecurePass Vault Logo"
            width={320}
            height={320}
            className="object-contain mb-16 w-48 lg:w-80"
            priority
          />
          <h1 className="text-base lg:text-lg font-medium mb-12 lg:mb-16 text-gray-300 text-center max-w-2xl px-4">
            The safest place to store your passwords —<br />zero-knowledge architecture &amp; two-layer encryption.
          </h1>
          {/* Register and Login Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 lg:gap-12 mb-12 lg:mb-16">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowRegisterModal(true);
              }}
              className="w-full sm:w-32 px-8 py-3 rounded-md font-semibold  border border-yellow-500 bg-yellow-500 hover:bg-gray-600 hover:border-gray-600 text-center"
            >
              Register
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowLoginModal(true);
              }}
              className="w-full sm:w-32 px-8 py-3 rounded-md font-semibold text-white border border-gray-600 bg-gray-600 hover:bg-teal-900 hover:border-teal-900 transition-all duration-200 text-center"
            >
              Login
            </button>
          </div>
          {/* Feature Boxes - Centered and Wider */}
          <section className="py-20 px-6 bg-#1a1b1f">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
              <div className="p-6 backdrop-blur-md bg-white/5 rounded-xl shadow">
                <h3 className="text-xl font-semibold glow mb-2">Zero-Knowledge Architecture</h3>
                <p className="text-slate-300 text-sm">
                  Your data is encrypted before it even leaves your device. Not even we can see your passwords.
                </p>
              </div>
              <div className="p-6 backdrop-blur-md bg-white/5 rounded-xl shadow">
                <h3 className="text-xl font-semibold glow mb-2">Two-Layer Encryption</h3>
                <p className="text-slate-300 text-sm">
                  AES encryption on the frontend and backend ensures your credentials are secure — twice.
                </p>
              </div>
              <div className="p-6 backdrop-blur-md bg-white/5 rounded-xl shadow">
                <h3 className="text-xl font-semibold glow mb-2">Trustless by Design</h3>
                <p className="text-slate-300 text-sm">
                  Designed with security-first principles — we can&apos;t read, retrieve, or misuse your data.
                </p>
              </div>
            </div>
          </section>
        </div>
        {/* Top-right: logo.png image */}
        <div className="absolute top-4 lg:top-8 right-4 lg:right-12 z-20 flex items-center justify-end">
          <a
            href="https://cybercordon.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity duration-200"
          >
            <Image
              src="/logo.png.png"
              alt="CyberCordon Logo"
              width={64}
              height={64}
              className="object-contain h-8 w-auto lg:h-12 cursor-pointer"
              priority
            />
          </a>
        </div>
      </section>

      {/* Modals */}
      {(showLoginModal || showRegisterModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          {showLoginModal && (
            <div className="bg-[#181c1b] p-8 w-full max-w-md rounded-lg shadow-xl relative z-50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold neon-text">Login</h2>
                <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
              </div>
              <form onSubmit={handleLogin} className="flex flex-col space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                  />
                </div>
                <button type="submit" className="px-6 py-3 bg-[color:var(--neon)] text-black font-semibold rounded-md hover:bg-blue-400 transition-all duration-200">
                  Login
                </button>
              </form>
            </div>
          )}

          {showRegisterModal && (
            <div className="bg-[#181c1b] p-8 w-full max-w-md rounded-lg shadow-xl relative z-50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold neon-text">Register</h2>
                <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
              </div>
              <form onSubmit={handleRegister} className="flex flex-col space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                  />
                </div>
                <button type="submit" className="px-6 py-3 bg-[color:var(--neon)] text-black font-semibold rounded-md hover:bg-blue-400 transition-all duration-200">
                  Register
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
