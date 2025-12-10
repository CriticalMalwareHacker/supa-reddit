import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const redditUsername = searchParams.get("reddit_username")
  const next = searchParams.get("next") ?? "/user/dashboard"

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
        // Extract the Provider ID (Discord Numeric ID)
        const discordIdentity = user.identities?.find(id => id.provider === 'discord');
        const discordId = discordIdentity?.id; // e.g. "1234567890..."

        // Check if user exists in public.users table
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', user.id)
            .single()

        // If user is new, create record with Provider ID
        if (!existingUser) {
            const userData: any = {
                auth_id: user.id,
                email: user.email,
                role: 'user',
                provider_id: discordId // <--- CRITICAL: Saves the Discord ID
            }

            if (redditUsername) {
                userData.reddit_username = redditUsername
            }

            await supabase.from('users').insert(userData)
        } 
        // OPTIONAL: If user exists but is missing provider_id, update it
        else if (!existingUser.provider_id && discordId) {
             await supabase
                .from('users')
                .update({ provider_id: discordId })
                .eq('auth_id', user.id)
        }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}