# SuperCampus frontend overview

## Purpose

`supercampus-web` is the browser application for SuperCampus. It is a Next.js 16 / React 19 monorepo that provides the platform shell and the user interfaces for CRM, admissions, academics, attendance, documents, examinations, fees, gate pass, hostel, library, placement, and transport.

The primary application is `apps/platform`. Shared UI, state, contracts, API transport, runtime rendering, and feature packages live in `packages/*` and `modules/*`.

## Runtime topology

```text
Browser
  -> http://localhost:3000 (Next.js application)
  -> /api/* (same-origin Next.js route proxy)
  -> http://127.0.0.1:4000/api/* (Rust platform API)
  -> PostgreSQL (through the API only)
```

The browser never needs a direct database connection. API requests are deliberately same-origin so the API's HTTP-only authentication cookies remain available without exposing an API hostname to browser code.

## Local development

Requirements: Node.js 20.9+ and npm.

```powershell
cd C:\supercampus\supercampus-web
npm install
npm run dev
```

The platform app runs at `http://localhost:3000`. Its local configuration belongs in `apps/platform/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=/api
API_PROXY_TARGET=http://127.0.0.1:4000/api
```

`NEXT_PUBLIC_API_URL` is the browser-visible, same-origin base path. `API_PROXY_TARGET` is read only by the Next.js server route and selects the Rust API target. Changes to either value require restarting `npm run dev`.

## App Router and API proxy

The catch-all route `apps/platform/src/app/api/[[...path]]/route.ts` proxies all HTTP verbs from `/api/*` to `API_PROXY_TARGET`.

It:

- preserves method, request body, query string, upstream status, and response body;
- removes hop-by-hop headers that must not be forwarded;
- forwards browser cookies so session authentication works;
- adds forwarding metadata for the original host and protocol; and
- returns a `502` JSON error only when the upstream API cannot be reached.

Consequently, a `502 API service unavailable` in the UI indicates an API target or API process issue, not a credentials failure.

## Authentication and application state

`apps/platform/src/lib/api.ts` centralizes HTTP calls. It adds `x-client-surface: website`, sends credentials with each request, enforces a 12-second request timeout, parses API error responses, and refreshes an expired session once when appropriate.

The sign-in flow is:

1. `LoginPage` collects an email and password.
2. `login()` calls `POST /api/auth/login` through the proxy.
3. The API sets HTTP-only access and refresh cookies and returns the signed-in student and role data.
4. `AppProvider` calls `GET /api/state` to load the user's persisted workspace state.
5. The authenticated layout and role-filtered navigation render.

`AppProvider` also debounces state changes and saves them to `PUT /api/state`. A login can therefore succeed while the page still shows an error if state hydration fails; both `/auth/login` and `/state` must work.

## Admissions and CRM

The admissions workspace is primarily implemented in `apps/platform/src/app/(staff)/dashboard/admissions/page.tsx`. It loads CRM boards, campaigns, forms, permissions, and analytics through `lib/crm-api.ts`.

Published CRM lead-capture and enquiry forms are rendered from their saved schema. When a form is submitted:

1. required fields are checked in the browser;
2. the selected source, student contact data, interest, priority, and form values are assembled;
3. `submitCrmForm()` posts the data to `/api/v1/crm/forms/{id}/submit`; and
4. the board refreshes after a successful response.

For source fields, the frontend now prefers the options stored on the published form. It uses the global CRM source catalog only when the form has no options. This prevents the UI from offering choices that the published form will reject.

## Package boundaries

| Location | Responsibility |
| --- | --- |
| `apps/platform` | Next.js pages, layouts, server routes, app context, feature screens |
| `packages/api-client` | typed API transport primitives |
| `packages/contracts` | frontend runtime contracts |
| `packages/module-sdk` | module registration contract |
| `packages/runtime` | dynamic form, view, dashboard, report, and permission rendering |
| `packages/state` | shared state helpers |
| `packages/ui` | reusable UI primitives and design tokens |
| `modules/*` | isolated frontend domain packages |
| `contracts` | JSON schemas for manifests and configurable artifacts |
| `tooling` | module validation and related commands |

## Commands and verification

```powershell
npm run dev
npm run lint
npm run typecheck:packages
npm run test
npm run validate:modules
npm run build
npm run verify
```

`npm run build` requires production environment values, including `NEXT_PUBLIC_API_URL`. Existing repository lint findings outside a specific change may cause the workspace-wide lint command to fail; inspect the reported files before treating that as a regression in the current work.

## Operational checks

```powershell
Invoke-WebRequest http://127.0.0.1:3000
Invoke-WebRequest http://127.0.0.1:3000/api/health
```

The first verifies the Next.js app. The second verifies that the frontend proxy can reach the Rust API. A healthy proxy response is expected to be an API response, not a proxy-generated `502`.

## Security boundaries

- Authentication cookies are HTTP-only and are not handled directly by application code.
- Browser requests use the same origin (`/api`).
- The proxy is server-side and accepts only HTTP(S) API targets.
- Runtime permissions and tenant filtering are enforced by the backend; frontend visibility is not a security boundary.
- `.env.local` is local configuration and must not contain or commit production credentials.
