import Landing from '@/modules/landing/features/home/components/Landing';
import { jsonLd, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/modules/landing/features/home/seo';
import type { Metadata } from 'next';

const title = 'CodeControl — Software a medida y soluciones de gestión';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'es_AR',
    title,
    description: SITE_DESCRIPTION,
    images: [{ url: '/logo-azul.png', alt: 'CodeControl' }],
  },
  twitter: { card: 'summary', title, description: SITE_DESCRIPTION, images: ['/logo-azul.png'] },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Landing />
    </>
  );
}
