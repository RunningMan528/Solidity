import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/components/Web3Provider';
import { AlertProvider } from '@/components/AlertProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '多签钱包 - Multi-Signature Wallet',
  description: '一个安全、去中心化的多签钱包应用',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Web3Provider>
          <AlertProvider>{children}</AlertProvider>
        </Web3Provider>
      </body>
    </html>
  );
}

