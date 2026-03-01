import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/auth-context';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import PagePaddingWrapper from '@/components/page-padding-wrapper';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ShohorKotha PWA',
  description: 'Report, Resolve, Share',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <AuthProvider>
          <div className="flex min-h-screen w-full flex-col">
            <Navbar />
            <PagePaddingWrapper>
              {children}
            </PagePaddingWrapper>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
