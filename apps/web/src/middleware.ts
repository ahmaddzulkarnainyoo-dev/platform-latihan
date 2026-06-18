import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const path = request.nextUrl.pathname

  // === Rute publik (boleh diakses tanpa login) ===
  const publicRoutes = ['/', '/login', '/register', '/admin/login']
  const isPublicRoute = publicRoutes.some(route => path === route)

  // === Proteksi rute privat ===
  // Proteksi /dashboard dan /tryout/* (harus login)
  if ((path.startsWith('/dashboard') || path.startsWith('/tryout')) && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Proteksi /admin/* (harus login, nanti bisa ditambah role check)
  if (path.startsWith('/admin') && !session) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // === Redirect jika sudah login dan mengakses rute login/register ===
  if (session) {
    // Jika sudah login dan akses halaman login user, redirect ke dashboard
    if (path === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Jika sudah login dan akses halaman register, redirect ke dashboard
    if (path === '/register') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Jika sudah login dan akses halaman login admin, redirect ke admin
    if (path === '/admin/login') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}