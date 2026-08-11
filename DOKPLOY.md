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

Configure the server-side API proxy at runtime:

```env
NODE_ENV=production
API_PROXY_TARGET=http://supercampus-backend:4000/api
```

The frontend health check verifies this backend connection. A missing or
unreachable `API_PROXY_TARGET` keeps the new container unhealthy so traffic is
not shifted to a login page that cannot reach the API.

Do not add database credentials or backend secrets to the frontend service.
Attach the frontend domain to port `3000` with HTTPS, deploy the backend first,
and verify login plus authenticated `/api` requests after deployment.
