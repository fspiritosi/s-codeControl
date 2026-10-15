import { AI_BOTS, PRIVATE_PATHS, SITE_URL } from '@/modules/landing/features/home/seo';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const disallow = [...PRIVATE_PATHS];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      // Buscadores con IA y asistentes: pueden leer y citar la landing pública.
      { userAgent: [...AI_BOTS], allow: '/', disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
