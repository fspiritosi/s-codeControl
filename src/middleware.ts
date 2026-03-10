import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // --- NextAuth session (primary auth) ---
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const userRole = session.user.role;
  const profileId = session.user.profileId;
  const companyId = session.user.companyId;

  // Read actualComp cookie for guest role check
  const actualNoOwnerValue: string | null = req.cookies.get('actualComp')?.value ?? null;
  const actualNoOwner = actualNoOwnerValue ? actualNoOwnerValue.replace(/^"|"$/g, '') : null;
  const actualNow = actualNoOwner;

  // Query shared company role (the one remaining DB query)
  let guestRoleValue: string | null = null;
  if (profileId && actualNow) {
    const sharedUser = await prisma.share_company_users.findFirst({
      where: { profile_id: profileId, company_id: actualNow },
      select: { role: true },
    });
    guestRoleValue = sharedUser?.role ?? null;
  }

  // Check if user has any company (owned or shared)
  const hasOwnedCompany = !!companyId;
  let hasSharedCompany = false;
  if (!hasOwnedCompany && profileId) {
    const sharedCount = await prisma.share_company_users.count({
      where: { profile_id: profileId },
    });
    hasSharedCompany = sharedCount > 0;
  }

  if (!hasOwnedCompany && !hasSharedCompany && !req.url.includes('/dashboard/company/new')) {
    return NextResponse.redirect(new URL('/dashboard/company/new', req.url));
  }

  // --- Role-based routing logic ---
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

  const isAuditor = userRole === 'Auditor';

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
    if (guestRoleValue === 'Invitado') {
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

    if (guestRoleValue === 'Administrador' && administradorUser.some((url) => req.url.includes(url))) {
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl.toString());
    }
    if (guestRoleValue === 'Usuario' && usuarioUser.some((url) => req.url.includes(url))) {
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl.toString());
    }
  }
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
