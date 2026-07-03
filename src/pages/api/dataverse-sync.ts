import type { APIRoute } from 'astro'
import { upsertContact, type ProfileRecord } from '../../lib/dataverse'

// Called by a Supabase Database Webhook on INSERT/UPDATE of public.profiles.
// Mirrors the signup into Dynamics 365 as a Contact. Authenticated with a
// shared secret sent by the webhook (configured as a custom header in Supabase).
export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.DATAVERSE_WEBHOOK_SECRET
  if (!secret) return json({ error: 'Dataverse sync is not configured' }, 503)

  if (request.headers.get('x-webhook-secret') !== secret) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let payload: { type?: string; record?: ProfileRecord }
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'Invalid body' }, 400)
  }

  const record = payload?.record
  if (!record?.email) {
    // Nothing actionable — ack so Supabase doesn't retry a malformed/no-op event.
    return json({ ok: true, skipped: true }, 200)
  }

  try {
    const result = await upsertContact(record)
    return json({ ok: true, result }, 200)
  } catch (err) {
    // 5xx so the Supabase webhook retries (Dataverse blip, token expiry, etc.).
    console.error('dataverse-sync failed:', err)
    return json({ error: 'Sync failed' }, 502)
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
