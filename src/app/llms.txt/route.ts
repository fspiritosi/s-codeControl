import { PRODUCTS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/modules/landing/features/home/seo';

export const dynamic = 'force-static';

export function GET() {
  const body = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `${SITE_NAME} desarrolla software a medida y productos de gestión para empresas de Argentina.`,
    '',
    '## Productos',
    '',
    ...PRODUCTS.map((p) => `- [${p.name}](${p.url}): ${p.description}`),
    '',
    '## Contacto',
    '',
    `- [Sitio web](${SITE_URL}/)`,
    '- ventas@codecontrol.com.ar',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
