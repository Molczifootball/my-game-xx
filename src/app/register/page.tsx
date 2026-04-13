"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setError('Account created but login failed. Try signing in.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden" style={{
      backgroundImage: 'linear-gradient(rgba(10, 10, 15, 0.8), rgba(10, 10, 15, 0.8)), url(/images/slavic_bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img 
            src="/images/malachite_logo.png" 
            alt="Malachite Software Logo" 
            className="w-16 h-16 mx-auto mb-4 object-contain brightness-110 drop-shadow-[0_0_10px_rgba(45,160,140,0.3)]"
          />
          <h1 className="text-3xl text-primary font-bold medieval-font tracking-widest mb-2">Lechia Online</h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest">Forge Your Dynasty</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-low border border-outline-variant rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-sm text-gray-300 font-bold uppercase tracking-widest text-center">Create Account</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded px-3 py-2 text-red-400 text-xs text-center">{error}</div>
          )}

          <div>
            <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold block mb-1">Ruler Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={2}
              maxLength={24}
              className="w-full bg-black/30 border border-outline-variant rounded px-3 py-2 text-sm text-white outline-none focus:border-primary/50 transition-colors"
              placeholder="Lord Mieszko"
            />
          </div>

          <div>
            <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-black/30 border border-outline-variant rounded px-3 py-2 text-sm text-white outline-none focus:border-primary/50 transition-colors"
              placeholder="warrior@lechia.com"
            />
          </div>

          <div>
            <label className="text-[9px] text-gray-400 uppercase tracking-widest font-bold block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-black/30 border border-outline-variant rounded px-3 py-2 text-sm text-white outline-none focus:border-primary/50 transition-colors"
              placeholder="••••••••"
            />
            <span className="text-[8px] text-gray-600 mt-0.5 block">Minimum 6 characters</span>
          </div>

          <div className="flex items-start gap-2 mt-2">
            <input
              type="checkbox"
              id="acceptTerms"
              required
              className="mt-1 accent-primary ring-0 outline-none"
            />
            <label htmlFor="acceptTerms" className="text-[10px] text-gray-400 leading-tight">
              I accept the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>, <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <span className="text-gray-300">Cookie Usage</span> policy.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 gold-button rounded transition-all active:scale-95 disabled:opacity-50 text-sm"
          >
            {loading ? 'Creating...' : 'Forge My Dynasty'}
          </button>

          <div className="text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-bold">Sign In</Link>
          </div>
        </form>
      </div>
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="text-[9px] text-gray-600 font-mono uppercase tracking-widest opacity-40">
          Property of <span className="text-primary/60">Malachite Software</span> © 2026
        </span>
      </div>
    </div>
  );
}
