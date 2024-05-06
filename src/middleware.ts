import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import cookie from 'js-cookie'

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
  const actualCompanyId = cookie.get('actualCompanyId')

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
  if (isAuditor && !req.url.includes('/auditor')) {
    return NextResponse.redirect(new URL('/auditor', req.url))
  }
  if (!isAuditor && req.url.includes('/auditor')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auditor/:path*'],
}
