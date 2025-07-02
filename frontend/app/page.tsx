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
  const [showMobilePopup, setShowMobilePopup] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('dismissMobilePopup');
    if (!dismissed && typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowMobilePopup(true);
    }
  }, []);


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
      <section className="w-full lg:w-110 lg:fixed lg:top-0 lg:left-0 bg-[#0d0f0f] flex flex-col justify-between p-4 sm:p-6 lg:p-12 z-30">
        <div>
          <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 mb-6 sm:mb-8">
            <span>© 2025 • Cyber Cordon</span>
            <span>ver 2.3.0</span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-4xl font-semibold mb-3 text-center sm:mb-4" style={{ letterSpacing: '0.01em' }}>
            Vault so secure even Gru can&apos;t break in
          </div>
          <div className="accent-line" />
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <Image
              src="/gru.gif"
              alt="Animated Art"
              width={400}
              height={300}
              className="object-contain w-full max-w-xs sm:max-w-sm lg:max-w-md mx-auto"
              priority
            />
          </div>
          {/* About Us Button */}
          <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://cybercordon.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-black bg-[#e0ffe0] border border-[#e0ffe0] rounded-lg hover:bg-[color:var(--neon)] hover:text-[#e0ffe0] hover:border-[color:var(--neon)] transition-all duration-200 w-full sm:w-48"
              >
                VAPT Services
              </a>
              <Link
                href="/aboutus"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-black bg-[#e0ffe0] border border-[#e0ffe0] rounded-lg hover:bg-[color:var(--neon)] hover:text-[#e0ffe0] hover:border-[color:var(--neon)] transition-all duration-200 w-full sm:w-48"
              >
                About Us
              </Link>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-1">USERS ON BOARD</div>
          <span className="stat-number text-xl sm:text-2xl">{userCount !== null ? userCount : "-"}</span>
        </div>
      </section>

      {/* Right Panel */}
      <section className="lg:ml-110 min-h-screen overflow-y-auto bg-[#1a1b1f] flex-1 flex flex-col items-center justify-start relative min-h-screen overflow-y-auto p-4 sm:p-6">
        <div className="relative z-10 flex flex-col items-center pt-0 mt-10">
          <Image
            src="/applogo.png.png"
            alt="SecurePass Vault Logo"
            width={320}
            height={320}
            className="object-contain mb-10 w-40 sm:w-48 lg:w-80"
            priority
          />
          <h1 className="text-sm sm:text-base lg:text-lg font-medium mb-10 sm:mb-12 lg:mb-16 text-gray-300 text-center max-w-2xl px-4">
            The safest place to store your passwords —<br />zero-knowledge architecture &amp; two-layer encryption.
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-12 mb-10 sm:mb-12 lg:mb-16">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowRegisterModal(true);
              }}
              className="w-full sm:w-32 px-6 py-3 rounded-md font-semibold border border-yellow-500 bg-yellow-500 hover:bg-[color:var(--neon)] hover:border-[color:var(--neon)] text-center"
            >
              Register
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowLoginModal(true);
              }}
              className="w-full sm:w-32 px-6 py-3 rounded-md font-semibold text-white border border-gray-600 bg-gray-600 hover:bg-[color:var(--neon)] hover:border-[color:var(--neon)] transition-all duration-200 text-center"
            >
              Login
            </button>
          </div>

          <section className="py-10 sm:py-20 px-4 sm:px-6 bg-[#1a1b1f] w-full">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-center">
              <div className="p-4 sm:p-6 backdrop-blur-md bg-transparent rounded-xl shadow">
                <h3 className="text-lg sm:text-xl font-semibold glow mb-2">Zero-Knowledge Architecture</h3>
                <p className="text-slate-300 text-sm">
                  Your data is encrypted before it even leaves your device. Not even we can see your passwords.
                </p>
              </div>
              <div className="p-4 sm:p-6 backdrop-blur-md bg-transparent rounded-xl shadow">
                <h3 className="text-lg sm:text-xl font-semibold glow mb-2">Two-Layer Encryption</h3>
                <br />
                <p className="text-slate-300 text-sm">
                  AES encryption on the frontend and backend ensures your credentials are secure — twice.
                </p>
              </div>
              <div className="p-4 sm:p-6 backdrop-blur-md bg-transparent rounded-xl shadow">
                <h3 className="text-lg sm:text-xl font-semibold glow mb-2">Trustless by Design</h3>
                <br />
                <p className="text-slate-300 text-sm">
                  Designed with security-first principles — we can&apos;t read, retrieve, or misuse your data.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Top-right logo */}
        <div className="absolute top-2 sm:top-4 lg:top-8 right-2 sm:right-4 lg:right-12 z-20">
          <a
            href="https://cybercordon.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity duration-200"
          >
            <Image
              src="/logo.png.png"
              alt="CyberCordon Logo"
              width={48}
              height={48}
              className="object-contain h-6 sm:h-8 lg:h-12 w-auto cursor-pointer"
              priority
            />
          </a>
        </div>
      </section>

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
                <div className="mt-6 p-4 rounded-xl bg-[color:var(--neon)]/10 border border-[color:var(--neon)]/20">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[color:var(--neon)] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-[color:var(--neon)]">Important Note:</span> Your password is used for generating your encryptyion key. Make sure you always remember it. We cannot help in retrieving your passwords in case you forget your vault&apos;s password.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
      {showMobilePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-[#1e1e1e] border border-[color:var(--neon)] p-6 rounded-xl shadow-lg max-w-sm text-center space-y-4">
            <h2 className="text-xl font-bold neon-text">Heads Up!</h2>
            <p className="text-gray-300 text-sm">
              This site is optimized for desktop. For the best experience, please switch to a larger screen.
            </p>
            <button
              onClick={() => {
                sessionStorage.setItem('dismissMobilePopup', 'true');
                setShowMobilePopup(false);
              }}
              className="mt-2 px-4 py-2 bg-[color:var(--neon)] text-black rounded-lg font-semibold hover:bg-opacity-90 transition"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
