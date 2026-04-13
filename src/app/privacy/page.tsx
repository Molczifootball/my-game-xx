"use client";

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center relative overflow-hidden" style={{
      backgroundImage: 'linear-gradient(rgba(10, 10, 15, 0.9), rgba(10, 10, 15, 0.9)), url(/images/slavic_bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="max-w-3xl w-full glass-panel border border-outline-variant p-6 md:p-10 rounded-xl space-y-6">
        <div className="mb-8 border-b border-outline-variant pb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl text-primary font-bold medieval-font tracking-[0.2em] uppercase">Privacy Policy</h1>
              <p className="text-gray-500 text-[10px] mt-2 font-mono uppercase tracking-widest">Effective Date: April 13, 2026</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-primary/40 font-mono uppercase tracking-widest border border-primary/20 px-2 py-1 rounded">Malachite Software</span>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase border-l-4 border-primary pl-4">1. Data Controller</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            <span className="text-primary font-bold">Malachite Software</span> is the sole owner and data controller of all information collected on Lechia Online. We are committed to protecting the privacy of our rulers and lords.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase border-l-4 border-primary pl-4">2. Collection of Personal Data</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            To provide the game experience, we collect:
          </p>
          <ul className="list-disc list-inside text-gray-400 text-sm space-y-2">
            <li><span className="text-white">Account Info:</span> Email, Username, and Hashed Password.</li>
            <li><span className="text-white">Game Metadata:</span> Timestamps of sessions, IP addresses for security audits, and village progress.</li>
            <li><span className="text-white">Communication:</span> Transcripts of global chat logs for moderation purposes.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase border-l-4 border-primary pl-4">3. Cookie & Session Policy</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We use <span className="text-white">Essential Cookies</span> only. These are required for the "Sign In" functionality and to prevent cross-site request forgery attacks. We do not use tracking or advertising cookies.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase border-l-4 border-primary pl-4">4. Data Sharing & Retention</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We <span className="text-white font-bold">never sell or rent</span> your data to third parties. We retain your information for as long as your account is active. If you request account deletion, all associated data is purged within 30 days.
          </p>
        </section>

        <section className="space-y-4 pt-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase border-l-4 border-primary pl-4">5. Your Legal Rights</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Under global privacy regulations (such as GDPR), you have the right to access, correct, or delete your personal data. You may initiate these requests via our support channels or directly from the Overseer Dashboard if available.
          </p>
        </section>

        <div className="pt-10 flex flex-col md:flex-row gap-4 justify-center items-center border-t border-outline-variant">
          <Link href="/login" className="gold-button px-8 py-3 rounded-lg text-sm transition-all active:scale-95 w-full md:w-auto text-center">
            Return to Login
          </Link>
          <Link href="/terms" className="text-gray-500 hover:text-white text-[11px] uppercase tracking-widest font-bold transition-colors">
            View Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
