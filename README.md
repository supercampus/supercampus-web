# Super Campus

Tenant-aware student portal built with Next.js 16, Express 5 and PostgreSQL.

## Requirements

- Node.js 20.9 or newer
- npm
- PostgreSQL database

## Fresh clone setup

```bash
git clone https://github.com/supercampus/supercampus-web.git
cd supercampus-web
npm run setup
```

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

On Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

Update `backend/.env` with a valid `DATABASE_URL`, a unique `JWT_SECRET` of at least 32 characters, and the frontend origin. The frontend defaults to `http://localhost:4000/api`; copy `.env.local.example` to `.env.local` only when using a different API URL.

Prepare and verify the database:

```bash
npm run db:migrate
npm run db:verify
npm run doctor
```

Start the two services in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Open `http://localhost:3000`.

## Validation

```bash
npm run verify
```

## Production deployment

Use the root production `Dockerfile` to run the Next.js frontend and Express API in one container. See [DOKPLOY.md](./DOKPLOY.md) for exact Dokploy, DNS, environment, health-check and deployment settings.

## Project structure

- `src/` — Next.js frontend
- `backend/` — Express API, authentication and PostgreSQL migrations
- `Dockerfile` — combined Next.js and Express production image
- `scripts/start-production.mjs` — runs migrations, the API and the frontend