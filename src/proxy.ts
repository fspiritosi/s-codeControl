import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy ligero (antes "middleware" en Next ≤15): propaga el pathname
 * como header `x-pathname` para que los server components (layouts)
 * puedan leerlo y aplicar guards basados en permisos. No hace DB queries.
 */
export function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
