import type { APIRoute } from 'astro'
import { createHmac, timingSafeEqual } from 'node:crypto'

// On-demand (serverless) — Supabase's Send Email Hook POSTs here to send auth
// emails. We relay through the Resend API so we can set a Reply-To that lands
// in the real, monitored mailbox while still sending from the verified subdomain.
export const prerender = false

// --- Sender identity -------------------------------------------------------
const FROM = 'The Mole Clinic <wellbeing@cpd.themoleclinic.co.uk>'
const REPLY_TO = 'wellbeing@themoleclinic.co.uk'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
// Reject requests whose signed timestamp is older than this (replay protection).
const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60

/**
 * Verify the Standard Webhooks signature Supabase attaches to the hook request.
 * Secret format from Supabase is "v1,whsec_<base64>"; the signing key is the
 * base64-decoded portion after the prefix.
 */
function verifySignature(secret: string, headers: Headers, body: string): boolean {
  const id = headers.get('webhook-id')
  const timestamp = headers.get('webhook-timestamp')
  const signatureHeader = headers.get('webhook-signature')
  if (!id || !timestamp || !signatureHeader) return false

  // Replay protection: timestamp must be recent.
  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return false
  const skew = Math.abs(Date.now() / 1000 - ts)
  if (skew > TIMESTAMP_TOLERANCE_SECONDS) return false

  const base64Secret = secret.replace(/^v1,/, '').replace(/^whsec_/, '')
  const key = Buffer.from(base64Secret, 'base64')
  const signedContent = `${id}.${timestamp}.${body}`
  const expected = createHmac('sha256', key).update(signedContent).digest('base64')
  const expectedBuf = Buffer.from(expected)

  // The header is a space-delimited list of "v<version>,<signature>" entries.
  return signatureHeader.split(' ').some((entry) => {
    const sig = entry.includes(',') ? entry.slice(entry.indexOf(',') + 1) : entry
    const sigBuf = Buffer.from(sig)
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf)
  })
}

interface EmailData {
  token: string
  token_hash: string
  redirect_to: string
  email_action_type: string
  site_url: string
}

function shell(bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f3f7f8;">
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;line-height:1.5;max-width:480px;margin:0 auto;padding:32px 24px;">
    <h1 style="color:#0e7490;font-weight:600;font-size:20px;margin:0 0 24px;">The Mole Clinic</h1>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px;">
    <p style="font-size:12px;color:#6b7280;margin:0;">Skin Cancer CPD for physiotherapists. If you didn't request this, you can safely ignore this email.</p>
  </div></body></html>`
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${href}" style="background:#0e7490;color:#ffffff;text-decoration:none;font-weight:500;padding:12px 24px;border-radius:8px;display:inline-block;">${label}</a></p>
  <p style="font-size:13px;color:#6b7280;">Or paste this link into your browser:<br><a href="${href}" style="color:#0e7490;word-break:break-all;">${href}</a></p>`
}

function buildEmail(data: EmailData, recipientNote = '') {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
  const verifyUrl =
    `${supabaseUrl}/auth/v1/verify?token=${data.token_hash}` +
    `&type=${data.email_action_type}&redirect_to=${encodeURIComponent(data.redirect_to)}`

  switch (data.email_action_type) {
    case 'signup':
      return {
        subject: 'Confirm your email address',
        html: shell(`<h2 style="font-size:16px;font-weight:600;margin:0 0 8px;">Confirm your email address</h2><p style="margin:0;">Follow the link below to confirm your address and finish signing up.</p>${button(verifyUrl, 'Confirm email address')}`),
        text: `Confirm your email address and finish signing up:\n${verifyUrl}`,
      }
    case 'magiclink':
      return {
        subject: 'Your sign-in link',
        html: shell(`<h2 style="font-size:16px;font-weight:600;margin:0 0 8px;">Sign in to your CPD account</h2><p style="margin:0;">Click below to sign in. This link can only be used once.</p>${button(verifyUrl, 'Sign in')}`),
        text: `Sign in to your CPD account:\n${verifyUrl}`,
      }
    case 'recovery':
      return {
        subject: 'Reset your password',
        html: shell(`<h2 style="font-size:16px;font-weight:600;margin:0 0 8px;">Reset your password</h2><p style="margin:0;">Follow the link below to choose a new password.</p>${button(verifyUrl, 'Reset password')}`),
        text: `Reset your password:\n${verifyUrl}`,
      }
    case 'invite':
      return {
        subject: "You've been invited to the TMC CPD programme",
        html: shell(`<h2 style="font-size:16px;font-weight:600;margin:0 0 8px;">You've been invited</h2><p style="margin:0;">You've been invited to The Mole Clinic Skin Cancer CPD programme. Accept the invite to set up your account.</p>${button(verifyUrl, 'Accept invite')}`),
        text: `You've been invited to the TMC CPD programme:\n${verifyUrl}`,
      }
    case 'email_change':
    case 'email_change_current':
    case 'email_change_new':
      return {
        subject: 'Confirm your email change',
        html: shell(`<h2 style="font-size:16px;font-weight:600;margin:0 0 8px;">Confirm your new email address</h2><p style="margin:0;">Follow the link below to confirm the change to your email address.${recipientNote}</p>${button(verifyUrl, 'Confirm email change')}`),
        text: `Confirm your email change:\n${verifyUrl}`,
      }
    case 'reauthentication':
      return {
        subject: 'Your verification code',
        html: shell(`<h2 style="font-size:16px;font-weight:600;margin:0 0 8px;">Verification code</h2><p style="margin:0;">Enter this code to continue:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#0e7490;margin:16px 0;">${data.token}</p>`),
        text: `Your verification code is ${data.token}`,
      }
    default:
      return {
        subject: 'The Mole Clinic',
        html: shell(`<p style="margin:0;">Follow the link below to continue.</p>${button(verifyUrl, 'Continue')}`),
        text: `Follow the link to continue:\n${verifyUrl}`,
      }
  }
}

export const POST: APIRoute = async ({ request }) => {
  const hookSecret = import.meta.env.SEND_EMAIL_HOOK_SECRET
  const resendApiKey = import.meta.env.RESEND_API_KEY
  if (!hookSecret || !resendApiKey) {
    console.error('auth-email hook: missing SEND_EMAIL_HOOK_SECRET or RESEND_API_KEY')
    return errorResponse(500, 'Email hook is not configured')
  }

  // Read the raw body — the signature is computed over the exact bytes.
  const rawBody = await request.text()

  if (!verifySignature(hookSecret, request.headers, rawBody)) {
    return errorResponse(401, 'Invalid signature')
  }

  let payload: { user: { email: string; new_email?: string }; email_data: EmailData }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return errorResponse(400, 'Invalid payload')
  }

  const { user, email_data } = payload
  const toNewAddress = email_data.email_action_type === 'email_change_new'
  const to = toNewAddress && user.new_email ? user.new_email : user.email

  const { subject, html, text } = buildEmail(email_data)

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [to], reply_to: [REPLY_TO], subject, html, text }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('auth-email hook: Resend rejected send', res.status, detail)
      return errorResponse(502, 'Failed to send email')
    }
  } catch (err) {
    console.error('auth-email hook: error calling Resend', err)
    return errorResponse(502, 'Failed to send email')
  }

  // Supabase treats a 200 with empty body as success.
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Supabase auth hooks expect errors in this shape so the message surfaces cleanly.
function errorResponse(httpCode: number, message: string): Response {
  return new Response(JSON.stringify({ error: { http_code: httpCode, message } }), {
    status: httpCode,
    headers: { 'Content-Type': 'application/json' },
  })
}
