# TMC CPD Microsite

The Mole Clinic's free 1-hour skin cancer CPD programme for UK physiotherapists:
marketing pages plus a gated, account-based course with video modules, sequential
unlocking, and completion tracking.

## Stack

- [Astro 6](https://astro.build) — static marketing pages + SSR (on-demand) app pages via [`@astrojs/netlify`](https://docs.astro.build/en/guides/integrations-guide/netlify/)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com) — auth (implicit flow, email confirmation + magic links) and Postgres with row-level security
- [Resend](https://resend.com) — transactional auth emails (sender `wellbeing@cpd.themoleclinic.co.uk`)
- [Azure Blob Storage](https://azure.microsoft.com/en-gb/products/storage/blobs) — private course videos, served via short-lived SAS URLs
- [Netlify](https://netlify.com) — hosting/CDN, deployed from GitHub `main`

## Running locally

```sh
npm install
npm run dev
```

Then open [http://localhost:4321](http://localhost:4321). Copy `.env.example` to `.env`
and fill in the values (see below).

## Environment variables

See `.env.example`. Public (`PUBLIC_*`) values ship to the browser; the rest are
server-only and must also be set in Netlify (Project configuration → Environment
variables) for the deployed site:

- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — signs nothing client-side; server use only
- `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_CONTAINER`, `AZURE_STORAGE_KEY` — video SAS
- `RESEND_API_KEY`, `SEND_EMAIL_HOOK_SECRET` — only needed if the Supabase Send Email Hook is enabled

## Deploying

Push to `main` → Netlify builds (`npm run build`) and publishes `dist`. Config is in
`netlify.toml` (build, Node version, security headers, secret-scan exemptions).

Custom domain: `cpd.themoleclinic.co.uk`.

## Key routes

| Route | Purpose |
|---|---|
| `/` | Hero, why physios, module preview, sign-up |
| `/programme`, `/about`, `/privacy`, `/thanks` | Static marketing/info pages |
| `/login`, `/logout`, `/auth/*` | Authentication (SSR) |
| `/dashboard` | Gated course: module list, video modal, progress (SSR) |
| `/api/complete-module` | Records module completion (server-side gated) |
| `/api/auth-email` | Supabase Send Email Hook endpoint (optional; off unless configured) |

## Data model

See `supabase/migrations/0001_initial_schema.sql` — `profiles`, `modules`,
`module_completions`, with RLS policies and a trigger that creates a profile row on signup.

## Brand tokens

Defined in `src/styles/global.css` under `@theme`:

| Token | Hex |
|---|---|
| `tmc-primary` | `#006F96` |
| `tmc-accent` | `#05B1C0` |
| `tmc-light` | `#D5EAED` |
| `tmc-mid` | `#91D1DC` |
| `tmc-text` | `#395171` |
| `tmc-surface` | `#F4F4F4` |
