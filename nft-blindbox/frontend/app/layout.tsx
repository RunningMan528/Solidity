import type { Metadata } from 'next';
import { Web3Provider } from '@/components/Web3Provider';
import './globals.css';
import { APP_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}

