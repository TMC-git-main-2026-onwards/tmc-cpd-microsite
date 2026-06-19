import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { AstroCookies } from 'astro'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

export const getBrowserClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey)

/**
 * Service-role client for privileged, server-only operations (e.g. signing
 * URLs for private Storage objects). NEVER import this into client-side code:
 * the key bypasses RLS. It is read from a non-PUBLIC env var so Astro keeps it
 * server-side only. Throws if the key is missing so misconfig fails loudly.
 */
export const getAdminClient = () => {
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const getServerClient = (request: Request, cookies: AstroCookies) =>
  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const header = request.headers.get('cookie') ?? ''
        return header
          .split('; ')
          .filter(Boolean)
          .map((c) => {
            const idx = c.indexOf('=')
            return idx === -1
              ? { name: c, value: '' }
              : { name: c.slice(0, idx), value: c.slice(idx + 1) }
          })
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookies.set(name, value, options as any)),
    },
  })
