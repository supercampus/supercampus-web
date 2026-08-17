# Dokploy frontend deployment

This repository deploys only the Next.js frontend workspace. Deploy the Rust API
from `supercampus-backend` as a separate service.

| Dokploy field | Value |
| --- | --- |
| Build Type | `Dockerfile` |
| Build Path / Root Directory | `/` |
| Docker Context Path | `.` |
| Dockerfile Path | `Dockerfile` |
| Container Port | `3000` |
| Health path | `/health` |

Build the browser bundle against the same-origin API route:

```env
NEXT_PUBLIC_API_URL=/api
```

This is also the Dockerfile default, so a missing Dokploy build argument cannot
silently produce a cross-origin browser bundle. The browser remains on
`supercampus.ai`, which keeps the strict `connect-src 'self'` policy valid.

Configure the server-side proxy and health target at runtime:

```env
NODE_ENV=production
API_PROXY_TARGET=http://supercampus-backend:4000/api
```

Browser requests use `https://supercampus.ai/api/...`; the Next server forwards
them over Dokploy's private network to the backend service. The same backend
remains independently available to external clients at
`https://api.supercampus.ai/api/...`, while the browser bundle contains no
deployment-specific upstream hostname. If Dokploy assigned a different internal
service name, replace `supercampus-backend` with the private hostname shown for
the backend application.

The frontend health check verifies this backend connection. A missing or
unreachable API upstream keeps the new container unhealthy so traffic is not
shifted to a login page that cannot reach the API.

Do not add database credentials, JWT secrets, Cloudinary secrets, or any other
backend credentials to the frontend service or Docker build arguments.
Attach the frontend domain to port `3000` with HTTPS, deploy the backend first,
and verify login plus authenticated `/api` requests after deployment.
