import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data } = await supabase
    .from('profile')
    .select('role')
    .eq('email', session?.user.email)

  const isAuditor = data?.[0]?.role === 'Auditor'

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  // if (isAuditor && !req.url.includes('/auditor')) {
  //   return NextResponse.redirect(new URL('/auditor', req.url))
  // }
  // if (!isAuditor && req.url.includes('/auditor')) {
  //   return NextResponse.redirect(new URL('/login', req.url))
  // }
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auditor/:path*'],
}
