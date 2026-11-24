# Staging access — owner authorization required

Checked 2026-11-17. **No staging deployment exists and no test URL is available.** The original live site and main branch are unchanged. All work stays in PR #1. No subscriptions, billing, paid features or duplicate cloud projects have been activated.

## Existing Vercel: confirmed failure boundary

Existing project: `rahyar`, ID `prj_VWcZXiqXvf9CJLRqCsgr73fRqAlV`; team `team_PuUJOIzmcLUiNoqlGAdgDzLR`. The integration can read this project. It reports no latest deployment or domains. Git deployment context reports Hobby, no linked projects/origin connections, and **both `github` and `github-limited` namespace discovery return an empty list**. Repository selection is therefore blocked before build/deployment. Independent GitHub access to the private repository does not grant Vercel's GitHub App access.

The integration does not expose whether this is a missing Vercel-account GitHub connection, a GitHub App installation, or repository selection in that installation. Calling one specific checkbox the proven root cause would overstate the available evidence. The owner must inspect those account settings. Build output, Supabase and repository visibility are not evidenced as the cause of the namespace-discovery failure.

The [current Vercel Terms](https://vercel.com/legal/terms) say: **“You shall only use the Services under a Hobby plan for your personal or non-commercial use.”** Rahyar is explicitly a commercial application. A separate staging branch does not establish an exemption. We have not established Hobby eligibility, requested an upgrade or deployed there. A written eligibility clarification would be needed before considering Hobby for this use.

`vercel.json` deliberately disables Git deployments. Leave that protection in place. Do not connect/deploy main, promote a preview, assign a production domain or purchase Pro.

### Optional Vercel authorization inspection on iPad

1. Open Safari, use the page menu → **Request Desktop Website** if controls are hidden. Sign in to the intended Vercel account and select the team owning the existing `rahyar` project.
2. In GitHub, sign in as `fardad34`; open **Settings → Applications → Installed GitHub Apps → Vercel → Configure**. If absent, use [Vercel's GitHub App installation page](https://github.com/apps/vercel/installations/new).
3. Select the intended account and **Only select repositories → rahyar**; save. Authorize the intended GitHub identity in Vercel's account authentication settings if requested. Never paste a token into chat or repository files.
4. Inspect the existing project's **Settings → Git**; do not create a new Vercel project. Stop before enabling deployments while Hobby eligibility is unresolved. Report whether the repository is now visible; no paid upgrade is required to inspect access.

## Zero-cost alternatives

| Host | Evidence and limitations | Decision |
| --- | --- | --- |
| Existing Vercel Hobby | Commercial eligibility not established under current terms; Git namespaces empty | Do not deploy |
| Netlify credit-based Free | [$0 forever, 300 credits/month and hard limits that cannot incur costs](https://www.netlify.com/pricing/). [Official staff confirms commercial projects may use Free](https://answers.netlify.com/t/41545). [Private visibility is supported on Free, restricted to the Team Owner](https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility/). Personal-account private Git repositories supported; organization-owned private repositories require paid eligibility | Viable candidate for owner-only staging, subject to confirming the actual account is Free and authorizing GitHub |
| GitHub Pages | Private Pages access has plan restrictions; cannot run these Node APIs as-is | Does not satisfy protected complete staging without additional services |
| Cloudflare Pages/Workers | No authorized account/integration available here; current terms/quotas were not successfully verified | No project created; not claimed ready |

Netlify's [password protection](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/) is a paid feature: **do not enable it**. Use Private project/preview visibility instead. Free Private previews require the owner's Netlify login. The owner can use their own iPad and iPhone with their own login; this does not grant separate testers access. Do not share account passwords. If independent people need protected access, reassess a legitimately free option instead of upgrading automatically.

We have no authorized Netlify session/token or integration. **This is the exact owner-only blocker.** No website/project has been provisioned on Netlify. The following instructions are for the owner to authorize the alternative, not a claim it is already connected.

## Netlify owner steps on iPad

1. Open [Netlify](https://app.netlify.com/) in Safari; request Desktop Website if necessary. Sign in/create an account with **Free** selected, without entering payment details. Verify the team's billing page says the credit-based **Free** plan with hard limits. Stop if it requires payment, a trial converting to paid, or an upgrade. Verify GitHub lists `fardad34` as a personal account; stop if an organization-private repository restriction is presented.
2. Look through existing projects first. **Reuse an existing Rahyar staging project if one exists.** Do not create a second one. In **Team settings → General → Visitor access → Default project visibility**, set **Private** before importing. Older teams may default to Public; do not assume protection.
3. If no Rahyar staging project exists and you choose this alternative, use **Add new project → Import an existing project → GitHub**. Authorize Netlify's GitHub App for **Only select repositories → fardad34/rahyar**. This authorization is separate from Vercel and Codex. No API token needs to be sent to us.
4. Import the existing repository with root directory blank, production branch `main`, build command `node scripts/netlify-build.cjs`, publish directory `dist`, functions `netlify/functions`. The committed configuration intentionally **skips production builds and rejects main/master**; an initial production build may be marked skipped. Do not change those guards to obtain a URL. Enable **Deploy Previews for PRs**. A branch deployment, if needed, must select only `feature/comprehensive-staging-20261117T052834Z`.
5. Before triggering a preview, in **Project configuration → General → Visitor access → Project visibility**, verify **Private** for both production and deploy previews/branch deployments. Do not select a public preview or paid password/SSO option. Do not attach a custom domain.
6. Add `SUPABASE_URL=https://pdipokhucdzttziyzoiw.supabase.co` and `SUPABASE_PUBLISHABLE_KEY` using the existing project's **publishable** key from Supabase's Connect/API dialog. Use deployment-preview/branch contexts and Functions/runtime scope where available. If context scoping is unavailable, the project remains staging-only with production builds blocked. Never use `service_role`, `sb_secret_…`, a database password or a GitHub token. Do not copy the key into Git or chat.
7. Trigger the deploy preview for existing PR #1, or retry its preview build after configuration. Netlify should use this branch's committed `netlify.toml`; do not merge the PR. If an initial skipped build prevents preview discovery, select only the feature branch under branch-deploy settings. Do not enable all branch deployments. If that control is unavailable, stop and provide the non-secret build error.
8. Share the **project name and preview URL**, not credentials. A private URL showing a Netlify login while signed out is expected. After signing in as Team Owner, `/api/health` must show `status: ok`, auth reachable, and the reviewed commit SHA. We must still verify this deployed path; local tests alone do not establish hosting success.
9. In [existing Supabase Auth URL Configuration](https://supabase.com/dashboard/project/pdipokhucdzttziyzoiw/auth/url-configuration), add the **exact preview origin** as an allowed redirect URL for signup confirmation. Keep the current Site URL and existing production redirects intact; do not add a wildcard for every Netlify site. Signup now requests the current app origin. Confirm email delivery/login on the preview before counting signup complete.

Stop at any plan/billing prompt. The 300 credits are shared across deploys, requests, compute and bandwidth; avoid repeated builds. Exhausting Free limits can pause the staging site. No uptime guarantee or paid overage is authorized.

## Implementation and deployment verification

- `netlify/functions/` is a thin event adapter to the same existing config/health/ask handlers. It preserves bearer authentication, no-store responses and body limits; it does not copy privileged credentials or invent backend responses.
- `netlify.toml` routes `/api/config`, `/api/health`, `/api/ask`; security headers retain GPS/microphone access. `scripts/netlify-ignore.cjs` skips production, and `scripts/netlify-build.cjs` rejects production/main even if the skip is overridden.
- Local adapter tests and staging-context build pass. Actual Netlify packaging, private-preview protection, environment configuration, signup redirects and deployed realtime tests remain **unverified until authorization/deployment**.
- Existing Supabase project/migrations/RLS are retained. No additional database/project is necessary. Only publishable configuration reaches the browser; each signed-in account's JWT is checked and database RLS remains authoritative.
- To run browser tests against the resulting URL set `BASE_URL` for both `tests/integration/reports.browser.cjs` and `weigh-status.browser.cjs`; private Netlify access must first be supplied through an authorized protected session. Do not make the site public to bypass a test runner login. Test accounts/passwords belong in an external mode-0600 file, never Git.

## iPad/iPhone acceptance (not yet passed)

On the actual protected URL, use two independent Supabase test accounts in separate signed-in browser sessions/devices. Permit precise GPS and test near an appropriate registered station; do not submit synthetic observations as real road information. For lab tests use the automated emulated-GPS harness and hide synthetic reports afterward.

Verify one driver remains Unknown; matching fresh Open/Closed from two accounts appears on both; a conflict or opposite direction returns Unknown; source/capture/expiry text is visible; offline queue reconnects without duplication. Also test narrow-screen controls, landscape rotation, safe areas, first truck settings, route reload/GPS permission loss, Test Voice after a tap, radio coexistence, mic denial, signup email return, background/foreground and Safari offline storage eviction. Chromium emulation does not count as physical Safari testing.
