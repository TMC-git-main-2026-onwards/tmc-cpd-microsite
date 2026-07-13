// Turn Supabase auth errors (and network failures) into calm, user-facing text.
// Keeps raw internals like "email rate limit exceeded" or "Failed to fetch"
// off the screen — especially during a launch spike when rate limits are likely.
export function friendlyAuthError(err: { message?: string } | null | undefined): string {
  const m = (err?.message || '').toLowerCase()
  if (!m) return 'Something went wrong. Please try again.'
  if (m.includes('rate limit') || m.includes('rate_limit') || m.includes('too many'))
    return 'We are sending a lot of emails right now. Please wait a minute and try again.'
  if (m.includes('for security purposes') || m.includes('you can only request'))
    return 'Please wait a moment before requesting another link.'
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'That email or password is not right. Try again, or use a magic link instead.'
  if (m.includes('email not confirmed'))
    return 'Please confirm your email first — check your inbox (and spam folder) for the link.'
  if (m.includes('already registered') || m.includes('already exists'))
    return 'This email is already registered. Please sign in instead, or reset your password.'
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed'))
    return 'We could not reach the server. Please check your connection and try again in a moment.'
  // Fall back to Supabase's message if it looks presentable, else a generic line.
  return err?.message && err.message.length < 120 ? err.message : 'Something went wrong. Please try again.'
}
