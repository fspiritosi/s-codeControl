import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './lib/utils/middleware'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data } = await supabase
    .from('profile')
    .select('*')
    .eq('email', session?.user.email)

  const { data: Companies, error } = await supabase
    .from('company')
    .select(`*`)
    .eq('owner_id', data?.[0]?.id)

  const theme = res.cookies.get('theme')
  const actualCompanyId = req.cookies.get('actialCompanyId')
  //const actualNoOwner :string | null = req.cookies.get('actualComp')?.value
  const actualNoOwnerValue: string | null =
    req.cookies.get('actualComp')?.value ?? null
  const actualNoOwner = actualNoOwnerValue
    ? actualNoOwnerValue.replace(/^"|"$/g, '')
    : null

  const actualNow = actualNoOwner //!== null ? parseInt(actualNoOwner as string, 10) : null
  const { data: guestRole } = await supabase
    .from('share_company_users')
    .select('role')
    .eq('profile_id ', data?.[0]?.id)
    .eq('company_id', actualNow)

  const userRole = data?.[0]?.role

  const guestUser = [
    '/dashboard/employee/action?action=edit&',
    '/dashboard/employee/action?action=new',
    '/dashboard/equipment/action?action=edit&',
    '/dashboard/equipment/action?action=new',
    '/dashboard/company/new',
  ]

  if (!theme) {
    res.cookies.set('theme', 'light')
  }

  if (!actualCompanyId) {
    const companiesId = Companies?.filter(
      company => company.by_defect === true,
    )[0]?.id
    res.cookies.set('actualCompanyId', companiesId)
  }

  const isAuditor = data?.[0]?.role === 'Auditor'
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (userRole === 'Admin') {
    return res // Permitir acceso sin restricciones para los usuarios con rol 'Admin'
  } else {
    if (isAuditor && !req.url.includes('/auditor')) {
      return NextResponse.redirect(new URL('/auditor', req.url))
    }
    if (!isAuditor && req.url.includes('/auditor')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (
      guestRole?.[0]?.role === 'Invitado' &&
      guestUser.some(url => req.url.includes(url))
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    if (
      (guestRole?.[0]?.role === 'CodeControlCLient' ||
        guestRole?.[0]?.role === 'User' ||
        userRole === 'CodeControlCLient') &&
      guestUser.some(url => req.url.includes(url))
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }
  await updateSession(req)

  return res
}

export const config = {
  matcher: [
    // '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/dashboard/:path*',
    '/auditor/:path*',
  ],
}
