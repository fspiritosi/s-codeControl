import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  console.log('error ', error)
  console.log('Sesion ', session)

  if (!session) {
    return NextResponse.rewrite(new URL('/login', req.url))
  }
  return res
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
