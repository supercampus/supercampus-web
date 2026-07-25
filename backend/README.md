# Super Campus API

Tenant-aware Express 5 and PostgreSQL backend for the Super Campus dashboard.

## Local setup

1. Copy `.env.example` to `.env` and replace `JWT_SECRET` for non-local use.
2. Start a PostgreSQL 17 instance (the included `docker-compose.yml` is optional).
3. Run `npm install`.
4. Run `npm run db:migrate`.
5. Start the API with `npm run dev`.

The API runs at `http://localhost:4000` and accepts the frontend origin configured in `FRONTEND_ORIGIN`.

## Test students

| College tenant | Email | Password | Student |
| --- | --- | --- | --- |
| `SVCE` | `arun.kumar@svce.edu.in` | `Student@123` | Arun Kumar S |
| `REC` | `priya.sharma@rec.edu.in` | `Campus@123` | Priya Sharma |

Passwords are stored only as bcrypt hashes. These credentials are for local demonstration and must be replaced outside development.

## PostgreSQL tables

| Table | Purpose and main data |
| --- | --- |
| `tenants` | One row per college: tenant UUID, unique code, college name, city and active status. |
| `students` | Tenant-owned student identity and login data: tenant ID, roll number, email, bcrypt password hash, name, department, year and active status. Roll numbers are unique inside a tenant. |
| `student_app_state` | One JSONB dashboard-state document per student, plus optimistic version and update time. |
| `activity_events` | Append-only student activity audit records such as login, logout and dashboard actions. Indexed by student and newest event. |
| `schema_migrations` | Records migration filenames already applied so database upgrades run once and in order. |

## Authentication flow

- `POST /api/auth/login` validates the unique student email and password, then issues an 8-hour signed JWT in an HTTP-only cookie.
- `GET /api/auth/me` restores the current session.
- `POST /api/auth/logout` records the event and clears the cookie.
- Protected state and activity queries use both `student_id` and `tenant_id`.
- Login attempts are rate-limited and inactive colleges/students are rejected.

## Endpoints

Public:
- `GET /api/health`
- `GET /api/auth/tenants`
- `POST /api/auth/login`

Authenticated:
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/student`
- `GET /api/state`
- `PUT /api/state`
- `GET /api/activity?limit=20`