# CPD dependency review — 24 September 2026

Trello: https://trello.com/c/UWhWh4Tk

## Scope

Review-only branch. No production deployment, credentials, database changes, signup submissions or marketing emails. Application source and package.json are unchanged. Lockfile refresh stays within existing dependency ranges; no forced major upgrade.

## Result

`npm audit fix --package-lock-only --ignore-scripts --no-fund` reduced the local npm audit report from 32 vulnerabilities (3 low, 6 moderate, 21 high, 2 critical) to 10 (1 low, 8 high, 1 critical). These are package audit counts, not proven exploitable paths or GitHub alert counts.

Selected changes: Vite 7.3.3 → 7.3.6; devalue 5.8.1 → 5.9.4; js-yaml 4.3.0 → 4.3.2; PostCSS 8.5.15 → 8.5.28; SVGO 4.0.1 → 4.1.0; nanoid 3.3.12 → 3.3.19; smol-toml 1.7.0 → 1.9.0.

Astro remains 6.4.8 and @astrojs/netlify remains 7.0.13. Outstanding Astro/adapter/esbuild/sharp/extract-zip dependency paths require a separate reviewed upgrade. In particular, this patch does not resolve the critical Astro advisory. Do not describe the site as fully patched or approve launch from this change alone.

## Validation

- `npm ci --ignore-scripts --no-fund` succeeds in an isolated worktree.
- A build without environment settings stops at missing Supabase configuration.
- `npm run build` succeeds using only synthetic PUBLIC_SUPABASE_URL=https://build-check.invalid and PUBLIC_SUPABASE_ANON_KEY=synthetic-build-only. No production environment file was copied. Build output is ignored and must not be deployed.
- Build emits request-header warnings on prerendered routes; authenticated runtime flows are not validated by this build.
- Before merging: test login, reset/magic links, dashboard, quiz completion, certificates and protected assets in an isolated preview with test accounts/services; review remaining advisories and deployment configuration. Do not merge until deployment is authorised.

## Card reconciliation

Read-only public check on 24 September confirms the support email link already points to wellbeing@themoleclinic.co.uk in the signup help and footer. Mailbox monitoring, partner access, accreditation wording and campaign-send readiness remain unverified. No duplicate support-button implementation is needed.
