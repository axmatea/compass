# COMPASS

**Your team's context, tasks and decisions at one shared table.**

COMPASS is a workspace for people, not an agent-session monitor. Bring a project
brief, task CSV or a short update; keep source material alongside the work it
informs. Team members update tasks. The owner controls invitations and approval.

## Run

Node 22.12+. `npm ci`, `npm run build`, `npm start`.
Open http://localhost:8770. The public demo uses fictional data and no model APIs.

Private collaboration requires PostgreSQL, `DATABASE_URL`, `BETTER_AUTH_SECRET`
and `BETTER_AUTH_URL`. Use HTTPS in production. Existing invited Better Auth
accounts are retained; there is no public signup, automatic email or billing.
Team invitations allow an invited new user to register, then sign in and accept
membership. Tokens are secrets: share only with the intended recipient.

## What works and what does not

- React/SVG team table with accessible task and context controls; no fabricated
  online presence or productivity telemetry.
- Separate PostgreSQL workspace domain, owner/member permissions, versioned
  task changes, one-use invitations and source/audit records.
- Text, TXT, Markdown and CSV task imports with preview. Uploaded content is
  data, not permission to execute instructions. PDF/connectors are not included.
- Public demo interactions and sample recommendations are explicitly scripted.
- The AI runtime is **BLOCKED** until a human-workspace contract is implemented
  and verified. The existing simulated REMaster runtime is not sufficient.
  Manual collaboration does not depend on that runtime. No autonomous learning,
  lossless compression, provider success or long-horizon performance is claimed.

## Routes

`/` public example; `/app` private team workspace; `/login?returnTo=/app` sign-in.
`/demo/remaster` previous memory simulation. `/acquisition` and
`/acquisition/app` preserve the earlier acquisition product and its data.
Legacy presentation aliases lead to the current product rather than a slide deck.

## Verification and release

Run `npm run build`, `npm test`, `npm run test:workspaces` and
`npm run qa:workspace`. Database tests require an explicit local test DSN; see
`docs/WORKSPACE_RELEASE.md`. Never run cleanup tests against production.

See `docs/WORKSPACE_API.md` for the workspace contract and
`docs/WORKSPACE_RELEASE.md` for production gates and evidence. A local screenshot
or HTTP 200 is not proof of a deployed collaborative SaaS.

## Attribution

Selective movement/facing adaptation and visual-interaction reference:
[KbWen/agent-virtual-office](https://github.com/KbWen/agent-virtual-office), pinned
at `c238a30d51881fb2add5a0a875736d6e32ce542c`, MIT. Notice is served at
`/third-party/agent-virtual-office-LICENSE.txt`. No upstream session scanners,
coding-agent hooks or installers are imported. COMPASS's shared-workspace
backend is separate from that project.
