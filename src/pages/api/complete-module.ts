import type { APIRoute } from 'astro'
import { getServerClient } from '../../lib/supabase'

// Records that the signed-in user finished a module's video. Called by the
// dashboard when the modal video fires its `ended` event. Uses the user's own
// session, so RLS ("users insert own completions") enforces they can only
// write their own progress.
export const prerender = false

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = getServerClient(request, cookies)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user || userError) {
    return json({ error: 'Not authenticated' }, 401)
  }

  let moduleId: string | undefined
  try {
    moduleId = (await request.json())?.moduleId
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }
  if (!moduleId) return json({ error: 'moduleId is required' }, 400)

  // Idempotent: re-watching a completed module is a no-op (PK is user_id+module_id).
  const { error } = await supabase
    .from('module_completions')
    .upsert({ user_id: user.id, module_id: moduleId }, { onConflict: 'user_id,module_id', ignoreDuplicates: true })

  if (error) {
    console.error('complete-module: failed to record completion', error)
    return json({ error: 'Could not save your progress' }, 500)
  }
  return json({ ok: true }, 200)
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
