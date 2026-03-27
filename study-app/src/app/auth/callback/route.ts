import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed, onboarding_step')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // First login — create profile stub and redirect to onboarding
          await supabase.from('user_profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
            university: '',
            course: '',
            total_semesters: 0,
            current_semester: 0,
            onboarding_completed: false,
            onboarding_step: 'intro',
          })
          return NextResponse.redirect(`${origin}/onboarding/intro`)
        }

        if (!profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding/${profile.onboarding_step ?? 'intro'}`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
