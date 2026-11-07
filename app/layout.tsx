import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';

const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600'], variable: '--f-serif' });
const sans = Jost({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--f-body' });

export const metadata: Metadata = {
  title: 'Ahava',
  description: 'Precificação de peças de crochê',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAF7F2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}