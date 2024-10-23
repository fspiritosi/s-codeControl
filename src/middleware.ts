import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from './lib/supabase/server';

export async function middleware(req: NextRequest) {
  // await updateSession(req)
  const supabase = supabaseServer();
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data } = await supabase
    .from('profile')
    .select('*')
    .eq('email', session?.user.email || '');

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

  const actualNow = actualNoOwner; //!== null ? parseInt(actualNoOwner as string, 10) : null
  const { data: guestRole } = await supabase
    .from('share_company_users')
    .select('role')
    .eq('profile_id ', data?.[0]?.id || '')
    .eq('company_id', actualNow || '');

  //response.cookies.set('guestRole', guestRole?.[0]?.role)

  if (!Companies?.length && !share_company_users?.length && !req.url.includes('/dashboard/company/new')) {
    return NextResponse.redirect(new URL('/dashboard/company/new', req.url));
  }

  //const theme = response.cookies.get('theme')
  //const actualCompanyId = req.cookies.get('actialCompanyId')
  // const actualNoOwner :string | null = req.cookies.get('actualComp')?.value

  const userRole = data?.[0]?.role;

  const guestUser = [
    '/dashboard/employee/action?action=edit&',
    '/dashboard/employee/action?action=new',
    '/dashboard/equipment/action?action=edit&',
    '/dashboard/equipment/action?action=new',
    '/dashboard/company/new',
    '/dashboard/company/actualCompany',
  ]; // -> Rol tabla profile
  const allowedPathsguestUser = ['/dashboard/document', '/dashboard/employees', '/dashboard/equipment'];
  const usuarioUser = ['/dashboard/company/actualCompany', 'admin/auditor'];

  const administradorUser = ['admin/auditor'];
  const codeControlClientUser = ['admin/auditor'];

  const isAuditor = data?.[0]?.role === 'Auditor';

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (userRole === 'Admin') {
    return response; // Permitir acceso sin restricciones para los usuarios con rol 'Admin'
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
    //response.cookies.set('guestRole', guestRole?.[0]?.role)
    if (userRole === 'CodeControlClient' && codeControlClientUser.some((url) => req.url.includes(url))) {
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl.toString());
    }
    // if (guestRole?.[0]?.role === 'Invitado' && !req.url.includes('/dashboard/document')) {
    //   redirectUrl.pathname = '/dashboard/document';
    //   return NextResponse.redirect(redirectUrl.toString());
    // }

    // if (guestRole?.[0]?.role === 'Invitado' && guestUser.some((url) => req.url.includes(url))) {
    //   redirectUrl.pathname = '/dashboard/document/';
    //   return NextResponse.redirect(redirectUrl.toString());
    // }
    if (guestRole?.[0]?.role === 'Invitado') {
      // Si el usuario está en una ruta permitida, permitir la navegación
      const isAllowedPath = allowedPathsguestUser.some((path) => req.url.startsWith(path));

      if (isAllowedPath) {
        return NextResponse.next();
      }

      // Si el usuario está en una ruta restringida, redirigir a '/dashboard/document'
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
