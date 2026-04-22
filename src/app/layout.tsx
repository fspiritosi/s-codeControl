import { AuthProvider } from '@/shared/components/auth/AuthProvider';
import { ThemeProvider } from '@/shared/components/common/theme-provider';
import { Toaster as Sonner } from '@/shared/components/ui/sonner';
import { Toaster } from '@/shared/components/ui/toaster';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';

import './globals.css';
const popinsFont = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'CodeControl',
  description: 'Gestion para las empresas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={popinsFont.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <div>
              <Toaster />
              <Sonner richColors={true} />
              <main>{children}</main>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
