import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Whitelist : next doit être un chemin interne (jamais une URL absolue)
// Bloque les attaques de type : ?next=https://evil.com
const SAFE_REDIRECT_PATTERN = /^\/[a-zA-Z0-9\-_/]*$/;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // SÉCURITÉ : valider que `next` est un chemin interne — bloque les open redirects
  const rawNext = searchParams.get('next') ?? '/forge'
  const next = SAFE_REDIRECT_PATTERN.test(rawNext) ? rawNext : '/forge'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
