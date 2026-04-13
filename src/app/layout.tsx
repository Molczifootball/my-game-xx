import type { Metadata } from 'next';
import { Inter, Noto_Serif } from 'next/font/google';
import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import Providers from '@/components/Providers';
import { GameShell } from '@/components/GameShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const noto = Noto_Serif({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-noto' });

export const metadata: Metadata = {
  title: 'Lechia Online',
  description: 'The definitive medieval strategy MMO',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${noto.variable} scroll-smooth h-full`}>
      <body className="antialiased font-sans m-0 p-0 overflow-hidden h-full flex flex-col">
        <Providers>
          <GameShell>{children}</GameShell>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
