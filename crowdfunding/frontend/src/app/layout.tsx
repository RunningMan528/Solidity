import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/components/Web3Provider';
import { AlertProvider } from '@/components/AlertProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Crowdfunding Platform - Decentralized Funding',
  description: 'A decentralized crowdfunding platform built on Ethereum',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          <AlertProvider>{children}</AlertProvider>
        </Web3Provider>
      </body>
    </html>
  );
}

