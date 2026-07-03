// Server-only. Mirrors a CPD signup into Dynamics 365 / Dataverse as a Contact,
// matched on email so re-signups update rather than duplicate. Authenticates
// with the app registration via OAuth client-credentials.

export interface ProfileRecord {
  email?: string | null
  full_name?: string | null
  profession?: string | null
  workplace?: string | null
  hcpc_number?: string | null
  marketing_consent?: boolean | null
}

function env(name: keyof ImportMetaEnv): string {
  const v = import.meta.env[name] as string | undefined
  if (!v) throw new Error(`${String(name)} is not set`)
  return v
}

function baseUrl(): string {
  return env('DATAVERSE_URL').replace(/\/+$/, '')
}

async function getToken(): Promise<string> {
  const tenant = env('DATAVERSE_TENANT_ID')
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env('DATAVERSE_CLIENT_ID'),
    client_secret: env('DATAVERSE_CLIENT_SECRET'),
    scope: `${baseUrl()}/.default`,
  })
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Dataverse token request failed: ${res.status} ${await res.text()}`)
  return (await res.json()).access_token as string
}

export async function upsertContact(profile: ProfileRecord): Promise<'created' | 'updated'> {
  const email = profile.email?.trim()
  if (!email) throw new Error('profile has no email')

  const api = `${baseUrl()}/api/data/v9.2`
  const token = await getToken()
  const headers = {
    Authorization: `Bearer ${token}`,
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  // Name: split full_name into first/last; fall back to the email so Contact's
  // required primary (lastname) is always populated. Updated later if a name arrives.
  let firstname: string | undefined
  let lastname = email
  if (profile.full_name && profile.full_name.trim()) {
    const parts = profile.full_name.trim().split(/\s+/)
    lastname = parts[parts.length - 1]
    if (parts.length > 1) firstname = parts.slice(0, -1).join(' ')
  }

  const description = [
    'Source: CPD microsite signup',
    profile.profession ? `Profession: ${profile.profession}` : null,
    profile.workplace ? `Workplace: ${profile.workplace}` : null,
    profile.hcpc_number ? `HCPC number: ${profile.hcpc_number}` : null,
    `Marketing consent: ${profile.marketing_consent ? 'yes' : 'no'}`,
  ].filter(Boolean).join('\n')

  const fields: Record<string, unknown> = {
    emailaddress1: email,
    lastname,
    description,
    donotbulkemail: !profile.marketing_consent, // honour their marketing choice
  }
  if (firstname) fields.firstname = firstname
  if (profile.profession) fields.jobtitle = profile.profession

  // Look up an existing Contact by email (escape single quotes for OData).
  const filter = encodeURIComponent(`emailaddress1 eq '${email.replace(/'/g, "''")}'`)
  const findRes = await fetch(`${api}/contacts?$select=contactid&$filter=${filter}&$top=1`, { headers })
  if (!findRes.ok) throw new Error(`Dataverse lookup failed: ${findRes.status} ${await findRes.text()}`)
  const existing = (await findRes.json()).value?.[0]

  if (existing?.contactid) {
    const res = await fetch(`${api}/contacts(${existing.contactid})`, {
      method: 'PATCH', headers, body: JSON.stringify(fields),
    })
    if (!res.ok) throw new Error(`Dataverse update failed: ${res.status} ${await res.text()}`)
    return 'updated'
  }

  const res = await fetch(`${api}/contacts`, { method: 'POST', headers, body: JSON.stringify(fields) })
  if (!res.ok) throw new Error(`Dataverse create failed: ${res.status} ${await res.text()}`)
  return 'created'
}
