import type { APIRoute } from 'astro'
import { getServerClient, getAdminClient } from '../../lib/supabase'
import { QUESTIONS, PASS_MARK, PASS_PERCENT } from '../../lib/quiz'

// Scores the final assessment server-side and, on a pass, records it.
// The client submits its selected answer indexes; the answer key lives only
// on the server (src/lib/quiz.ts), so a forged request can't self-certify.
//
// Storage: the pass is recorded as quiz_score (a percentage) on the user's
// module_completions row for the FINAL module — using the existing
// quiz_score column so no schema migration is needed. RLS has no UPDATE
// policy on module_completions, so the write uses the admin client AFTER
// this endpoint has verified the user's session and their completion of
// every published module.
export const prerender = false

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = getServerClient(request, cookies)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user || userError) return json({ error: 'Not authenticated' }, 401)

  // All published modules must be complete before the quiz counts.
  const [{ data: modules }, { data: comps }] = await Promise.all([
    supabase.from('modules').select('id, order_index').eq('published', true).order('order_index'),
    supabase.from('module_completions').select('module_id').eq('user_id', user.id),
  ])
  if (!modules?.length) return json({ error: 'No modules available' }, 409)
  const done = new Set((comps ?? []).map((c) => c.module_id))
  if (!modules.every((m) => done.has(m.id))) {
    return json({ error: 'Complete all modules before taking the assessment' }, 403)
  }

  let answers: unknown
  try {
    answers = (await request.json())?.answers
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
    return json({ error: 'Answers must cover every question' }, 400)
  }

  const score = QUESTIONS.reduce(
    (n, q, i) => n + (answers[i] === q.a ? 1 : 0),
    0,
  )
  const percent = Math.round((score / QUESTIONS.length) * 100)
  const passed = score >= PASS_MARK

  if (passed) {
    // Record against the final module's completion row (exists — verified above).
    const lastModule = modules[modules.length - 1]
    const { error } = await getAdminClient()
      .from('module_completions')
      .update({ quiz_score: percent })
      .eq('user_id', user.id)
      .eq('module_id', lastModule.id)
    if (error) {
      console.error('complete-quiz: failed to record pass', error)
      return json({ error: 'Could not save your result — please try again' }, 500)
    }
  }

  return json({ score, total: QUESTIONS.length, percent, passed, passMark: PASS_MARK, passPercent: PASS_PERCENT }, 200)
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
