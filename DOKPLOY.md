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

When the backend is exposed through a separate production hostname, the proxy
also accepts an absolute runtime value such as
`NEXT_PUBLIC_API_URL=https://api.example.edu/api`. `API_PROXY_TARGET` remains
preferred when both variables are present because the internal Docker network
avoids an unnecessary public round trip.

The frontend health check verifies this backend connection. A missing or
unreachable API upstream keeps the new container unhealthy so traffic is not
shifted to a login page that cannot reach the API.

Do not add database credentials or backend secrets to the frontend service.
Attach the frontend domain to port `3000` with HTTPS, deploy the backend first,
and verify login plus authenticated `/api` requests after deployment.
