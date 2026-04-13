"use client";

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-dim p-8 flex flex-col items-center">
      <div className="max-w-3xl w-full glass-panel border border-outline-variant p-10 rounded-xl space-y-6">
        <div className="mb-8 border-b border-outline-variant pb-6">
          <h1 className="text-3xl text-primary font-bold medieval-font tracking-[0.2em] uppercase">Terms of Service</h1>
          <p className="text-gray-500 text-[10px] mt-2 font-mono uppercase tracking-widest">Last Updated: April 13, 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase">1. Acceptance of Terms</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            By entering the realm of Lechia Online, you agree to be bound by these Terms of Service. If you do not agree to all terms, you are forbidden from crossing our borders.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase">2. Rules of Engagement</h2>
          <ul className="list-disc list-inside text-gray-400 text-sm space-y-2">
            <li>No multi-accounting: One soul per lord.</li>
            <li>No automated scripts or black magic (bots).</li>
            <li>Respect the High King and fellow rulers in the chat.</li>
            <li>Abuse of game mechanics or glitches will lead to exile.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase">3. Virtual Assets</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            All villages, armies, and resources remain property of the crown. We reserve the right to seize lands from inactive or treasonous lords.
          </p>
        </section>

        <section className="space-y-4 pt-8 border-t border-outline-variant">
          <h2 className="text-lg text-white font-bold medieval-font uppercase">4. Cookie Policy</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We use essential cookies to maintain your session and ensure the safety of your treasury. By playing, you consent to these necessary cookies.
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
