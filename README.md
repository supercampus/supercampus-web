# SuperCampus web

Next.js 16 and React 19 frontend workspace for the configuration-driven
SuperCampus platform. The platform shell loads independently bounded modules for
CRM, Admissions, Academics, Attendance, Documents, Examinations, Fees, Gate Pass,
Hostel, Library, Placement, and Transport.

## Requirements

- Node.js 20.9 or newer
- npm 11 or newer

## Fresh clone setup

```bash
git clone https://github.com/supercampus/supercampus-web.git
cd supercampus-web
npm install
cp .env.local.example apps/platform/.env.local
npm run dev
```

On Windows, use `Copy-Item .env.local.example apps/platform/.env.local`.
The environment file is optional for local development; same-origin `/api`
requests proxy to `http://127.0.0.1:4000/api` by default. Open
`http://localhost:3000` after the development server starts.

## Commands

- `npm run dev` — run the platform app.
- `npm run validate:modules` — validate all module manifests and directories.
- `npm run typecheck:packages` — check shared packages and every module package.
- `npm run lint` — lint the platform app.
- `npm run build` — create the production standalone build.
- `npm run test` — run workspace tests.
- `npm run verify` — run all validation gates.

## Repository structure

- `apps/platform` — Next.js App Router shell, routes, layouts, and bootstrap.
- `packages/api-client` — typed HTTP transport.
- `packages/contracts` — shared TypeScript runtime contracts.
- `packages/module-sdk` — frontend module registration contract.
- `packages/runtime` — dynamic form/view/dashboard/report renderers and permissions.
- `packages/state` — framework-light shared state utilities.
- `packages/testing` — shared fixtures and test helpers.
- `packages/ui` — reusable UI foundations and design tokens.
- `modules/*` — independently bounded domain frontend packages.
- `contracts` — JSON Schemas for configuration, forms, and manifests.
- `tooling` — module validation and code-generation commands.
- `tests` — cross-workspace accessibility, contract, e2e, permission, and visual tests.

Existing screens remain in `apps/platform` while they are incrementally extracted
behind package and module contracts.

## Production

The root `Dockerfile` packages the monorepo-aware Next.js standalone output. Set
`API_PROXY_TARGET` at runtime and see `DOKPLOY.md` for deployment settings.
