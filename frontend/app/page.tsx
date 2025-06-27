'use client';

import Link from 'next/link';
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCrypto } from '@/contexts/cryptocontext';
import { deriveKeyFromPassword } from '@/lib/crypto/deriveKey';
import { generateSalt, encodeSalt } from '@/lib/crypto/salt';

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
    fetch("https://securepassvault-1.onrender.com/admin/user-count")
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

      // Fetch the salt
      const saltRes = await fetch(`/auth/salt?username=${encodeURIComponent(loginEmail)}`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });
      const saltData = await saltRes.json();
      toast.dismiss();

      if (!saltRes.ok || !saltData.salt) {
        toast.error(saltData.detail || 'Could not fetch salt');
        return;
      }

      // Store necessary data in sessionStorage
      sessionStorage.setItem('token', data.access_token);
      sessionStorage.setItem('salt', saltData.salt);
      sessionStorage.setItem('vault-password', loginPassword);
      sessionStorage.setItem('user-email', loginEmail);

      // Derive the encryption key
      const salt = Uint8Array.from(atob(saltData.salt), c => c.charCodeAt(0));
      const key = await deriveKeyFromPassword(loginPassword, salt);
      setDerivedKey(key);

      // Check if user is admin
      const meRes = await fetch('/auth/me', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });
      console.log('Login - Auth me response status:', meRes.status);

      if (meRes.ok) {
        const meData = await meRes.json();
        console.log('Login - User data from /auth/me:', meData);
        setShowLoginModal(false);
        if (meData.is_admin) {
          console.log('Login - User is admin, redirecting to /admin');
          router.push('/admin');
        } else {
          console.log('Login - User is not admin, redirecting to /vault');
          router.push('/vault');
        }
      } else {
        console.log('Login - Auth me failed, redirecting to /vault');
        setShowLoginModal(false);
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

      // Generate salt for the user
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
      <section className="split-left flex flex-col justify-between p-6 lg:p-12 w-full lg:max-w-[480px] min-h-screen lg:min-h-screen">
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-8">
            <span>© 2025 • A product by Cyber Cordon</span>
            <span>ver 2.0.1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4" style={{ letterSpacing: '0.01em' }}>SecurePass Vault</h1>
          <div className="accent-line" />
          <div className="mb-6 lg:mb-8">
            <Image
              src="/art.gif"
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
              className="px-3 py-1.5 rounded-md font-semibold text-[#e0ffe0] border border-[#e0ffe0] bg-transparent hover:bg-[#e0ffe0] hover:text-black transition-all duration-200 text-center w-full max-w-[150px]"
            >
              Visit
            </a>
            <Link
              href="/aboutus"
              className="px-3 py-1.5 rounded-md font-semibold text-black border border-[#e0ffe0] bg-[#e0ffe0] hover:bg-transparent hover:text-[#e0ffe0] transition-all duration-200 text-center w-full max-w-[150px]"
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
          <div className="text-base lg:text-lg font-medium mb-12 lg:mb-16 text-gray-300 text-center max-w-2xl px-4">
            The safest place to store your passwords —<br />zero-knowledge architecture & two-layer encryption.
          </div>
          {/* Register and Login Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 lg:gap-12 mb-12 lg:mb-16">
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('Register button clicked');
                setShowRegisterModal(true);
              }}
              className="w-full sm:w-32 px-8 py-3 rounded-md font-semibold neon-text border border-[color:var(--neon)] bg-transparent hover:bg-[color:var(--neon)] hover:text-white hover:shadow-lg hover:font-bold hover:!text-white transition-all duration-200 text-center"
            >
              Register
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('Login button clicked');
                setShowLoginModal(true);
              }}
              className="w-full sm:w-32 px-8 py-3 rounded-md font-semibold text-white border border-gray-500 bg-gray-900 hover:bg-gray-700 transition-all duration-200 text-center"
            >
              Login
            </button>
          </div>
          {/* Feature Boxes - Centered and Wider */}
          <div className="grid grid-cols-1 gap-6 w-full max-w-2xl px-4 lg:px-2 justify-self-start">
            <div className="flex flex-col items-start text-left w-full max-w-md">
              <h3 className="text-lg font-bold neon-text mb-2">Zero-Knowledge Architecture</h3>
              <p className="text-gray-300 text-sm">Your data is encrypted before it even leaves your device. Not even we can see your passwords.</p>
            </div>
            <div className="flex flex-col items-start text-left w-full max-w-md">
              <h3 className="text-lg font-bold neon-text mb-2">Two-Layer Encryption</h3>
              <p className="text-gray-300 text-sm">AES encryption on the frontend and backend ensures your credentials are secure — twice.</p>
            </div>
            <div className="flex flex-col items-start text-left w-full max-w-md">
              <h3 className="text-lg font-bold neon-text mb-2">Trustless by Design</h3>
              <p className="text-gray-300 text-sm">Designed with security-first principles — we can't read, retrieve, or misuse your data.</p>
            </div>
          </div>
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

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed top-0 right-0 h-full flex items-center justify-end z-50">
          <div className="bg-[#181c1b] border border-[color:var(--neon)]/40 p-8 w-full max-w-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold neon-text">Login</h2>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleLogin} className="flex flex-col space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-[color:var(--neon)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-[color:var(--neon)] focus:outline-none"
                />
              </div>
              <button type="submit" className="mt-auto px-6 py-3 bg-[color:var(--neon)] text-black font-semibold rounded-md hover:bg-blue-400 transition-all duration-200">
                Login
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed top-0 right-0 h-full flex items-center justify-end z-50">
          <div className="bg-[#181c1b] border border-[color:var(--neon)]/40 p-8 w-full max-w-md h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold neon-text">Register</h2>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleRegister} className="flex flex-col space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-[color:var(--neon)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-[color:var(--neon)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-[color:var(--neon)] focus:outline-none"
                />
              </div>
              <button type="submit" className="mt-auto px-6 py-3 bg-[color:var(--neon)] text-black font-semibold rounded-md hover:bg-blue-400 transition-all duration-200">
                Register
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
