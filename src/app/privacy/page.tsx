"use client";

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-dim p-8 flex flex-col items-center">
      <div className="max-w-3xl w-full glass-panel border border-outline-variant p-10 rounded-xl space-y-6">
        <div className="mb-8 border-b border-outline-variant pb-6">
          <h1 className="text-3xl text-primary font-bold medieval-font tracking-[0.2em] uppercase">Privacy Policy</h1>
          <p className="text-gray-500 text-[10px] mt-2 font-mono uppercase tracking-widest">Last Updated: April 13, 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase">1. Data Collection</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We only collect the minimum amount of data required to run the game: your email address, your ruler name, and your password (encrypted and salted).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase">2. Use of Data</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your data is used solely to provide and maintain your account and game progress. We do not sell your soul or your email to any merchant guilds or third-party advertisers.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase">3. Security</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We employ modern encryption and cryptographic alchemy to protect your credentials. However, no scrolls are 100% safe from powerful sorcery (hackers).
          </p>
        </section>

        <section className="space-y-4 pt-8 border-t border-outline-variant">
          <h2 className="text-lg text-white font-bold medieval-font uppercase">4. Your Rights</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            You have the right to request the deletion of your account and all associated data should you wish to retire from lordship forever.
          </p>
        </section>

        <div className="pt-10 flex justify-center">
          <Link href="/login" className="gold-button px-8 py-3 rounded-lg text-sm transition-all active:scale-95">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
