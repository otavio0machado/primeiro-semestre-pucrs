import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: Do NOT use getSession() — it reads from local storage and
  // isn't guaranteed to be authentic. Use getUser() which validates the JWT.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Public routes — no auth required
  const isPublicRoute =
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/registro') ||
    path.startsWith('/auth/')

  if (isPublicRoute) {
    // Public routes are always accessible, even if logged in.
    // This lets users visit landing, login, or registro freely.
    return supabaseResponse
  }

  // Onboarding routes — need auth but NOT completed onboarding
  if (path.startsWith('/onboarding')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // All other routes — need auth AND completed onboarding
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding/intro'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
