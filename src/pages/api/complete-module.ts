import type { APIRoute } from 'astro'
import { getServerClient } from '../../lib/supabase'

// Records that the signed-in user finished a module's video. Called by the
// dashboard when the modal video fires its `ended` event.
//
// Authorization is enforced server-side here — the client-side gating and
// skip-block are UX only and cannot be trusted. We require that the target
// module is published AND that every earlier module (lower order_index) is
// already complete, so a user can't POST arbitrary module ids to unlock the
// whole programme or fake completion out of order.
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
  if (!moduleId || typeof moduleId !== 'string') {
    return json({ error: 'moduleId is required' }, 400)
  }

  // The target module must exist and be published.
  const { data: target, error: targetErr } = await supabase
    .from('modules')
    .select('id, order_index, published')
    .eq('id', moduleId)
    .single()
  if (targetErr || !target || !target.published) {
    return json({ error: 'Module not found' }, 404)
  }

  // Every earlier published module must already be completed by this user —
  // i.e. the target is genuinely the next unlocked step (or an earlier one
  // being re-watched).
  const [{ data: priors }, { data: comps }] = await Promise.all([
    supabase.from('modules').select('id').eq('published', true).lt('order_index', target.order_index),
    supabase.from('module_completions').select('module_id').eq('user_id', user.id),
  ])
  const done = new Set((comps ?? []).map((c) => c.module_id))
  const allPriorsComplete = (priors ?? []).every((p) => done.has(p.id))
  if (!allPriorsComplete) {
    return json({ error: 'Complete the previous modules first' }, 403)
  }

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
