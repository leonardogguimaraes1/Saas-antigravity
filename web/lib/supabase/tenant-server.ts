import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createTenantServerClient(supabaseUrl: string, supabaseAnonKey: string) {
    const cookieStore = await cookies()

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Ignored in Server Components
                    }
                },
            },
        }
    )
}
