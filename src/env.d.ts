/// <reference types="astro/client" />

import type { Session, User } from '@supabase/supabase-js'

declare namespace App {
  interface Locals {
    session: Session | null
    user: User | null
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string
  readonly PUBLIC_SUPABASE_ANON_KEY: string
  // Server-only — used to sign URLs for private Storage objects. Never exposed to the client.
  readonly SUPABASE_SERVICE_ROLE_KEY: string
}
