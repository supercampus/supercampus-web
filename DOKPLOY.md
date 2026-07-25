# Dokploy single-application deployment

This repository runs the Next.js frontend and Express backend together in one production container. PostgreSQL remains the separate `Supercampus-DB` service.

## Architecture

```text
Your DNS -> Dokploy/Traefik -> Supercampus-web :3000
                                  |-- Next.js frontend
                                  +-- /api/* -> Express :4000 (internal only)

Supercampus-web -> Supercampus-DB :5432 (internal Dokploy network)
```

Only the Next.js port is publicly routed. The Express port is not exposed and does not need a separate DNS name.

## DNS

Create one record with your DNS provider:

| Type | Name | Value |
| --- | --- | --- |
| `A` | `portal` (or `@`) | your Dokploy server public IP |

Use DNS-only mode until Dokploy issues the TLS certificate.

## Supercampus-web settings

Use the Git repository root for this Dokploy Application.

| Dokploy field | Value |
| --- | --- |
| Build Type | `Dockerfile` |
| Build Path / Root Directory | `/` |
| Docker Context Path | `.` |
| Dockerfile Path | `Dockerfile` |
| Docker Build Stage | leave empty |
| Publish Directory | leave empty |
| Container Port | `3000` |

The Dockerfile defaults `NEXT_PUBLIC_API_URL` to `/api`; no API build argument is required. If you override it, keep the value `/api` for the single-domain deployment.

Add these runtime environment variables to `Supercampus-web`:

```env
NODE_ENV=production
FRONTEND_ORIGIN=https://portal.example.com
DATABASE_URL=postgresql://DB_USER:URL_ENCODED_PASSWORD@INTERNAL_POSTGRES_HOST:5432/DB_NAME
DATABASE_SSL=disable
PGPOOL_MAX=10
JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
```

Important:

- Replace `portal.example.com` with your actual domain, without a trailing slash.
- Use the PostgreSQL service's internal Dokploy hostname and port `5432`.
- URL-encode database password special characters (`@` becomes `%40`).
- Keep database credentials and `JWT_SECRET` as runtime environment variables, never build arguments.
- Use `DATABASE_SSL=disable` for the internal Dokploy PostgreSQL service unless TLS was explicitly enabled.

## Domain

In the `Supercampus-web` Domains tab, create:

- Host: `portal.example.com`
- Path: `/`
- Internal Path: `/`
- Container Port: `3000`
- HTTPS: enabled
- Certificate: Let's Encrypt

Do not expose port `4000`. API requests use the same public domain, for example:

```text
Your DNS -> Dokploy/Traefik -> Supercampus-web :3000
                                  |-- Next.js frontend
                                  +-- /api/* -> Express :4000 (internal only)

Supercampus-web -> Supercampus-DB :5432 (internal Dokploy network)
```

## Startup behavior

The single container performs these steps automatically:

1. Runs all pending PostgreSQL migrations.
2. Starts Express internally on port `4000`.
3. Starts Next.js on port `3000`.
4. Reports unhealthy if either the frontend or `/api/health` fails.
5. Stops the whole container if either Node process exits unexpectedly.

## Deployment

1. Push the combined Docker changes to the repository and select that branch in Dokploy.
2. Confirm `Supercampus-DB` is running.
3. Add the runtime variables above to `Supercampus-web`.
4. Configure the custom domain on container port `3000`.
5. Deploy `Supercampus-web`.
6. Verify `https://portal.example.com/api/health`.
7. Open `https://portal.example.com` and test login/logout.
8. Stop or delete the old separate `SuperCampus-Backend` application; it is no longer needed.

## Troubleshooting

- Frontend loads but login fails: open `/api/health` on the same domain and inspect container logs.
- Database hostname not found: ensure the database and application share the Dokploy network and use the internal database hostname.
- Database SSL error: set `DATABASE_SSL=disable` for the internal PostgreSQL service.
- Authentication cookie missing: ensure HTTPS is enabled and `FRONTEND_ORIGIN` exactly matches the public origin.
- Deployment stays unhealthy: inspect migration errors first; the application intentionally does not start when migrations fail.