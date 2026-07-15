import type { APIRoute } from 'astro'
import { getServerClient } from '../../lib/supabase'

// On-demand (serverless). A physio who has completed the CPD can request a
// supply of printed leaflets from the asset-pack page. We relay the form
// details to the marketing team via Resend (same sending identity as the
// auth emails), with reply-to set to the requester so marketing can respond
// directly. Gated to signed-in users to keep the endpoint from being abused.
export const prerender = false

const FROM = 'The Mole Clinic CPD <wellbeing@cpd.themoleclinic.co.uk>'
const TO = 'marketingteam@themoleclinic.co.uk'
const RESEND_ENDPOINT = 'https://api.resend.com/emails'

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

function json(status: number, obj: unknown): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request, cookies }) => {
  // Prefer the build-inlined value; fall back to the runtime process env, which
  // is how Netlify injects function env vars at request time.
  const resendApiKey =
    import.meta.env.RESEND_API_KEY ||
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.RESEND_API_KEY
  if (!resendApiKey) {
    console.error('leaflet-request: missing RESEND_API_KEY')
    return json(500, { error: 'Leaflet requests are not configured. Please email us instead.' })
  }

  // Only signed-in learners see the form; require a session so the endpoint
  // can't be sprayed anonymously.
  const supabase = getServerClient(request, cookies)
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (!user || userErr) return json(401, { error: 'Please sign in and try again.' })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'Invalid request.' })
  }

  const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
  const name = str(body.name, 120)
  const email = str(body.email, 200)
  const business = str(body.business, 160)
  const phone = str(body.phone, 40)
  const address = str(body.address, 600)
  const quantity = str(body.quantity, 40)

  if (!name || !address) {
    return json(400, { error: 'Please provide your name and postal address.' })
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json(400, { error: 'Please provide a valid email address.' })
  }

  const rows: [string, string][] = [
    ['Name', name],
    ['Email', email],
    ['Business / clinic', business || '—'],
    ['Phone', phone || '—'],
    ['Leaflets requested', quantity || '—'],
    ['Postal address', address],
    ['Account email', user.email ?? '—'],
  ]

  const subject = `CPD leaflet request — ${name}`
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;line-height:1.5;max-width:560px;">
    <h2 style="color:#0e7490;font-size:18px;margin:0 0 12px;">Leaflet request — Skin Cancer CPD</h2>
    <p style="margin:0 0 16px;">A physiotherapist who completed the Skin Cancer CPD programme has requested printed leaflets to give to their patients.</p>
    <table style="border-collapse:collapse;font-size:14px;">${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:5px 16px 5px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">${esc(k)}</td><td style="padding:5px 0;white-space:pre-wrap;">${esc(v)}</td></tr>`,
      )
      .join('')}</table>
    <p style="font-size:12px;color:#6b7280;margin:20px 0 0;">Reply directly to this email to reach the requester.</p>
  </div>`
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n')

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: [email], subject, html, text }),
    })
    if (!res.ok) {
      const detail = await res.text()
      console.error('leaflet-request: Resend rejected send', res.status, detail)
      return json(502, { error: 'Sorry, we could not send your request. Please try again.' })
    }
  } catch (err) {
    console.error('leaflet-request: error calling Resend', err)
    return json(502, { error: 'Sorry, we could not send your request. Please try again.' })
  }

  return json(200, { ok: true })
}
