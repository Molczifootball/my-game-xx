import type { Metadata } from 'next';
import { Inter, Noto_Serif } from 'next/font/google';
import './globals.css';
import { GameProvider } from '@/context/GameContext';
import Header from '@/components/Header';
import ResourceBar from '@/components/ResourceBar';
import SidebarLeft from '@/components/SidebarLeft';
// import SidebarRight from '@/components/SidebarRight';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const noto = Noto_Serif({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-noto' });

export const metadata: Metadata = {
  title: 'Tribal Wars Clone - Next.js',
  description: 'A modern strategy web game built with Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${noto.variable} scroll-smooth h-full`}>
      <body className="antialiased font-sans m-0 p-0 overflow-hidden h-full flex flex-col">
        <GameProvider>
          <div className="shrink-0 z-50 sticky top-0">
            <Header />
            <ResourceBar />
          </div>
          <main className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden w-full relative">
            <SidebarLeft />
            <section className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
              {children}
            </section>
          </main>
        </GameProvider>
      </body>
    </html>
  );
}
