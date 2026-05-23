import { defineMiddleware } from 'astro:middleware'
import { getServerClient } from './lib/supabase'

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = getServerClient(context.request, context.cookies)

  // getSession() reads cookies — fast but JWT is not re-validated server-side.
  // Protected routes (e.g. /dashboard) call getUser() for proper validation.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  context.locals.session = session
  context.locals.user = session?.user ?? null

  return next()
})
