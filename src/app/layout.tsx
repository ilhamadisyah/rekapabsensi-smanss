import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AutoAbsen SMANSS - Rekapitulasi Presensi Biometrik SMAN Sumatera Selatan',
  description: 'Sistem Otomasi Rekapitulasi Presensi Biometrik & Validasi Kehadiran Terintegrasi SMAN Sumatera Selatan',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex, nocache" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex, nocache" />
        <meta name="bingbot" content="noindex, nofollow, noarchive, nosnippet, noimageindex, nocache" />
      </head>
      <body className={`${plusJakartaSans.className} font-sans min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900`}>
        {children}
      </body>
    </html>
  );
}
