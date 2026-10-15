export const SITE_URL = 'https://www.codecontrol.com.ar';
export const SITE_NAME = 'CodeControl';
export const SITE_DESCRIPTION =
  'Software a medida y soluciones de gestión para conectar personas, información y operaciones. Conocé Alphataco, PyME Suite y Gestión de Taller.';

export const PRODUCTS = [
  {
    name: 'Alphataco',
    url: 'https://alphataco.com.ar/',
    description:
      'Sistema de gestión operativa para contratistas: documentación de personas y equipos con vencimientos, checklists con QR, taller, partes diarios y factura electrónica ARCA.',
  },
  {
    name: 'PyME Suite',
    url: 'https://www.pymesuites.com/',
    description:
      'Sistema en la nube de gestión comercial para pymes: stock, compras, facturación, clientes, cuentas corrientes, caja y reportes.',
  },
  {
    name: 'Gestión de Taller',
    url: 'https://gt.codecontrol.com.ar/',
    description:
      'Gestión para talleres mecánicos: recepción con fotos y daños, tablero de trabajo en vivo, presupuestos que el cliente aprueba online y panel del dueño.',
  },
] as const;

// Rutas privadas o sin valor para buscadores: se bloquean en robots y se marcan noindex.
export const PRIVATE_PATHS = [
  '/dashboard',
  '/admin',
  '/api',
  '/login',
  '/register',
  '/reset_password',
  '/hse',
  '/maintenance',
] as const;

export const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
] as const;

export const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo-azul.png`,
      email: 'ventas@codecontrol.com.ar',
      description: SITE_DESCRIPTION,
      areaServed: 'AR',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: 'es-AR',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    ...PRODUCTS.map((p) => ({
      '@type': 'SoftwareApplication',
      name: p.name,
      url: p.url,
      description: p.description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'es-AR',
      publisher: { '@id': `${SITE_URL}/#organization` },
    })),
  ],
};
