import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { supabaseServer } from './lib/supabase/server';

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // --- Phase 1: Try NextAuth session first ---
  const nextAuthSession = await auth();

  // --- Phase 2: Fall back to Supabase session ---
  const supabase = await supabaseServer();
  const {
    data: { session: supabaseSession },
  } = await supabase.auth.getSession();

  // Use NextAuth session user email if available, otherwise Supabase
  const userEmail = nextAuthSession?.user?.email ?? supabaseSession?.user.email;

  // If neither auth system has a session, redirect to login
  if (!nextAuthSession && !supabaseSession) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // --- Existing authorization logic (unchanged) ---
  const { data } = await supabase
    .from('profile')
    .select('*')
    .eq('email', userEmail || '');

  const { data: Companies, error } = await supabase
    .from('company')
    .select(`*`)
    .eq('owner_id', data?.[0]?.id || '');

  let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(`*`)
    .eq('profile_id', data?.[0]?.id || '');

  const actualNoOwnerValue: string | null = req.cookies.get('actualComp')?.value ?? null;
  const actualNoOwner = actualNoOwnerValue ? actualNoOwnerValue.replace(/^"|"$/g, '') : null;
  const actualNow = actualNoOwner;

  const { data: guestRole } = await supabase
    .from('share_company_users')
    .select('role')
    .eq('profile_id ', data?.[0]?.id || '')
    .eq('company_id', actualNow || '');

  if (!Companies?.length && !share_company_users?.length && !req.url.includes('/dashboard/company/new')) {
    return NextResponse.redirect(new URL('/dashboard/company/new', req.url));
  }

  const userRole = data?.[0]?.role;

  const guestUser = [
    '/dashboard/employee/action?action=edit&',
    '/dashboard/employee/action?action=new',
    '/dashboard/equipment/action?action=edit&',
    '/dashboard/equipment/action?action=new',
    '/dashboard/company/new',
    '/dashboard/company/actualCompany',
  ];
  const allowedPathsguestUser = ['/dashboard/document', '/dashboard/employees', '/dashboard/equipment'];
  const usuarioUser = ['/dashboard/company/actualCompany', 'admin/auditor'];

  const administradorUser = ['admin/auditor'];
  const codeControlClientUser = ['admin/auditor'];

  const isAuditor = data?.[0]?.role === 'Auditor';

  if (userRole === 'Admin') {
    return response;
  } else {
    const baseUrl = req.url.includes('?') ? req.url.split('?')[0] : req.url;
    const redirectUrl = new URL(baseUrl);
    redirectUrl.searchParams.set('access_denied', 'true');

    if (isAuditor && !req.url.includes('admin/auditor')) {
      redirectUrl.pathname = '/auditor';
      return NextResponse.redirect(redirectUrl.toString());
    }
    if (!isAuditor && req.url.includes('admin/auditor')) {
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl.toString());
    }
    if (userRole === 'CodeControlClient' && codeControlClientUser.some((url) => req.url.includes(url))) {
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl.toString());
    }
    if (guestRole?.[0]?.role === 'Invitado') {
      const isAllowedPath = allowedPathsguestUser.some((path) => req.url.startsWith(path));

      if (isAllowedPath) {
        return NextResponse.next();
      }

      const isRestrictedPath = guestUser.some((path) => req.url.startsWith(path));

      if (isRestrictedPath) {
        redirectUrl.pathname = '/dashboard/document';
        return NextResponse.redirect(redirectUrl);
      }
    }

    if (guestRole?.[0]?.role === 'Administrador' && administradorUser.some((url) => req.url.includes(url))) {
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl.toString());
    }
    if (guestRole?.[0]?.role === 'Usuario' && usuarioUser.some((url) => req.url.includes(url))) {
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl.toString());
    }
  }
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
