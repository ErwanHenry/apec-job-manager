import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                       req.nextUrl.pathname.startsWith('/register')
    const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth')

    // Allow API auth routes
    if (isApiAuthRoute) {
      return NextResponse.next()
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Allow authenticated users to access protected routes
    if (isAuth) {
      return NextResponse.next()
    }

    // Redirect unauthenticated users to login
    if (!isAuth && !isAuthPage) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      )
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
