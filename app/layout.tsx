import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Scene Shift',
  description: 'Visual variations of real robot footage, generated with Reactor.',
  openGraph: {
    title: 'Scene Shift',
    description: 'Visual variations of real robot footage, generated with Reactor.',
  },
  twitter: {
    card: 'summary',
    title: 'Scene Shift',
    description: 'Visual variations of real robot footage, generated with Reactor.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
