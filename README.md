# TMC CPD Microsite

Marketing shopfront and waitlist capture for The Mole Clinic's free 1-hour skin cancer CPD programme for UK physiotherapists. Five static pages, no login, no course delivery — v1 only.

## Stack

- [Astro 6](https://astro.build) (static, TypeScript strict)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Netlify Forms](https://docs.netlify.com/forms/setup/) for waitlist capture

## Running locally

```sh
npm install
npm run dev
```

Then open [http://localhost:4321](http://localhost:4321).

## Deploying to Netlify

1. Push to GitHub (repo: `TMC-git-main-2026-onwards/tmc-cpd-microsite`)
2. Connect the repo in the Netlify dashboard
3. Build command: `npm run build`
4. Publish directory: `dist`
5. (Or just push — `netlify.toml` configures this automatically)

Custom domain: `cpd.themoleclinic.co.uk` (DNS CNAME to Netlify, configured in dashboard)

## Pages

| Route | Purpose |
|---|---|
| `/` | Hero, why physios, module preview, waitlist form |
| `/programme` | Full 5-module breakdown + completion details |
| `/about` | TMC background and why this CPD exists |
| `/privacy` | GDPR placeholder (needs legal review before launch) |
| `/thanks` | Post-form confirmation, CTA to /programme |

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
