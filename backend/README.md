# Landas backend (Express + PostgreSQL)

This is a real, standalone REST API. The frontend (`www/index.html`) no
longer talks to Supabase's client library directly — it calls this backend
over HTTP, and this backend is the only thing that talks to the database.

```
Browser/App (www/index.html)
        |  fetch() with JSON + JWT
        v
Express API (this folder)
        |  SQL via pg
        v
PostgreSQL database
```

## 1. Get a Postgres database

Any Postgres works. Two easy options:
- **Reuse your existing Supabase project purely as a Postgres database**:
  Project Settings > Database > Connection string (URI). This does NOT use
  Supabase's Auth or client library anymore — just its underlying Postgres.
- **Or run Postgres locally** (`brew install postgresql`, or Docker:
  `docker run -e POSTGRES_PASSWORD=devpass -p 5432:5432 postgres`).

Then load the schema:
```
psql "<your connection string>" -f schema.sql
```

## 2. Configure and run the backend

```
cd backend
npm install
cp .env.example .env
```
Edit `.env`:
- `DATABASE_URL` — your Postgres connection string from step 1
- `JWT_SECRET` — any long random string (used to sign login tokens)

Then:
```
npm start
```
You should see `Landas backend listening on port 4000`. Check it's alive:
```
curl http://localhost:4000/api/health
```

## 3. Point the frontend at it

In `www/index.html`, find:
```js
var API_BASE = "http://localhost:4000/api";
```
This already matches local development. For a real deployment, change it to
wherever you host the backend (e.g. `https://landas-api.onrender.com/api`),
and make sure that server allows CORS from your frontend's domain (the
backend currently allows all origins via `cors()` — tighten this before a
public launch, see below).

## API summary

| Method | Path                        | Auth            | What it does |
|--------|-----------------------------|------------------|--------------|
| POST   | /api/auth/signup/teacher    | none             | Create a teacher account, returns a JWT |
| POST   | /api/auth/signup/student    | none             | Create a student account, returns a JWT |
| POST   | /api/auth/login             | none             | Log in (either role), returns a JWT + profile |
| POST   | /api/auth/forgot-password   | none             | Stub — see note below |
| GET    | /api/auth/me                | Bearer token     | Get the logged-in user's own profile |
| PUT    | /api/students/me/result     | Bearer (student) | Save the logged-in student's quiz result |
| GET    | /api/students/roster        | Bearer (teacher) | List students in the teacher's own school+grade |

The JWT is returned by login/signup and the frontend keeps it in memory
(`authToken` in `index.html`) — it's attached automatically to every
subsequent request. Logging out just clears it client-side.

## Notes on what's simplified

- **Forgot password** is a stub (`/auth/forgot-password` always responds
  `{ok:true}` without sending an email). Wiring real reset emails needs an
  email provider account (Resend, SendGrid, etc.) — plug that into a new
  `POST /reset-password` route that verifies a short-lived signed token.
- **CORS** is wide open (`app.use(cors())`) for easy local development.
  Before a real deployment, restrict it: `cors({ origin: "https://yourdomain" })`.
- **Passwords** are hashed with bcrypt (10 rounds) — never stored in plain text.
- Row-level security is enforced in application code instead of database
  policies: e.g. `GET /students/roster` derives the school/grade from the
  teacher's own JWT server-side, so a teacher can't request another
  school's roster no matter what they send from the client.
