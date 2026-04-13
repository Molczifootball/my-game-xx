"use client";

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-dim p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-3xl w-full glass-panel border border-outline-variant p-6 md:p-10 rounded-xl space-y-6">
        <div className="mb-8 border-b border-outline-variant pb-6">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/images/malachite_logo.png" 
                alt="Malachite Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-2xl md:text-3xl text-primary font-bold medieval-font tracking-[0.2em] uppercase">Terms of Service</h1>
                <p className="text-gray-500 text-[10px] mt-1 font-mono uppercase tracking-widest">Effective Date: April 13, 2026</p>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <span className="text-[10px] text-primary/40 font-mono uppercase tracking-widest border border-primary/20 px-2 py-1 rounded">Malachite Software</span>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase border-l-4 border-primary pl-4">1. Acceptance of Agreement</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            By accessing or using <span className="text-white">Lechia Online</span> (the "Service"), owned and operated by <span className="text-primary font-bold">Malachite Software</span>, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase border-l-4 border-primary pl-4">2. Eligibility & Accounts</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Users must be at least 13 years old. You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
          </p>
          <div className="bg-red-500/5 border border-red-900/20 p-3 rounded text-[11px] text-red-400/80 italic">
            Note: Every player is restricted to one single account. Multi-accounting is strictly forbidden and will result in a permanent ban of all associated accounts.
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase border-l-4 border-primary pl-4">3. Prohibited Conduct</h2>
          <ul className="list-disc list-inside text-gray-400 text-sm space-y-2">
            <li><span className="text-gray-200 font-bold">Automation:</span> Use of bots, scripts, or macros to automate gameplay or data scraping is prohibited.</li>
            <li><span className="text-gray-200 font-bold">Harassment:</span> Toxic behavior, hate speech, or targeted harassment in the global chat will not be tolerated.</li>
            <li><span className="text-gray-200 font-bold">Exploitation:</span> Intentional abuse of bugs or unintended game mechanics for competitive advantage is a breach of these terms.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase border-l-4 border-primary pl-4">4. Intellectual Property</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            The Service and its original content, features, and functionality are and will remain the exclusive property of <span className="text-white">Malachite Software</span>. Our trademarks and trade dress may not be used in connection with any product or service without prior written consent.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-white font-bold medieval-font uppercase border-l-4 border-primary pl-4">5. Limitation of Liability</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            In no event shall <span className="text-white">Malachite Software</span> be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of the Service.
          </p>
        </section>

        <div className="pt-10 flex flex-col md:flex-row gap-4 justify-center items-center border-t border-outline-variant">
          <Link href="/login" className="gold-button px-8 py-3 rounded-lg text-sm transition-all active:scale-95 w-full md:w-auto text-center">
            Return to Login
          </Link>
          <Link href="/privacy" className="text-gray-500 hover:text-white text-[11px] uppercase tracking-widest font-bold transition-colors">
            View Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
