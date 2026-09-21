import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#00132b',
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://pradarsakai.vercel.app'
  ),
  title: "PradarshakAI - Ministry of Social Justice & Empowerment",
  description: 'Find the right government loan scheme, calculate your EMI, and locate the nearest eligible Channel Partner.',
  applicationName: 'PradarshakAI',
  icons: {
    icon: [
      { url: "/emblem-gold.png?v=2", href: "/emblem-gold.png?v=2" },
    ],
    apple: [
      { url: "/emblem-gold.png?v=2", href: "/emblem-gold.png?v=2" },
    ],
    shortcut: ['/emblem-gold.png?v=2'],
  },
  openGraph: {
    title: "PradarshakAI - Ministry of Social Justice & Empowerment",
    description: 'Find the right government loan scheme, calculate your EMI, and locate the nearest eligible Channel Partner.',
    url: 'https://pradarsakai.vercel.app',
    siteName: 'PradarshakAI',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 600,
        height: 600,
        type: 'image/png',
        alt: 'PradarshakAI Golden Lion Emblem',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: "PradarshakAI - Ministry of Social Justice & Empowerment",
    description: 'Find the right government loan scheme, calculate your EMI, and locate the nearest eligible Channel Partner.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body className="min-h-screen" suppressHydrationWarning style={{ colorScheme: 'light' }}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
