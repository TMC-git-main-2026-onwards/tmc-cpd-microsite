import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { AstroCookies } from 'astro'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

export const getBrowserClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey)

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
