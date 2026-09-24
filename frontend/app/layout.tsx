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
      { url: "/Pradarshak_logo_only.jpeg?v=3", href: "/Pradarshak_logo_only.jpeg?v=3" },
      { url: "/favicon.ico?v=3", href: "/favicon.ico?v=3" },
    ],
    apple: [
      { url: "/Pradarshak_logo_only.jpeg?v=3", href: "/Pradarshak_logo_only.jpeg?v=3" },
    ],
    shortcut: ['/Pradarshak_logo_only.jpeg?v=3'],
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
        url: '/Pradarshak_logo_only.jpeg',
        width: 600,
        height: 600,
        type: 'image/jpeg',
        alt: 'PradarshakAI Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: "PradarshakAI - Ministry of Social Justice & Empowerment",
    description: 'Find the right government loan scheme, calculate your EMI, and locate the nearest eligible Channel Partner.',
    images: ['/Pradarshak_logo_only.jpeg'],
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
