import { ThemeProvider } from '@/components/theme-provider';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';

import './globals.css';
const inter = Inter({ subsets: ['latin'] });
const popinsFont = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'CodeControl',
  description: 'Gestión para las empresas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={popinsFont.className}>
        <ThemeProvider attribute="class" defaultTheme="ligth" enableSystem disableTransitionOnChange>
          <Toaster />
          <Sonner richColors={true} />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
