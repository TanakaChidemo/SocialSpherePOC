# Deployment

This project is currently a local, in-memory demo (see
[`ARCHITECTURE.md`](ARCHITECTURE.md) — no database, nothing persists across
a restart). There is no staging/production deployment target yet, so there
is nothing to run a deploy runbook against.

For local use, see [`RUNNING.md`](RUNNING.md) — `docker compose up --build`
is the whole story.

## If this ever needs a real deployment

Once the project moves past the in-memory demo stage (i.e. a real
database backs `backend/src/data/store.js`), the things a
production deployment would need to cover are:

- A managed database instead of local containers (and migrations to keep
  its schema in sync with the code).
- Secrets management: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
  `META_APP_SECRET`, `GROQ_API_KEY`/`OPENAI_API_KEY`, and database
  connection strings — injected via a secrets store, never committed.
- A container registry + a `docker-compose.prod.yml` (or equivalent) that
  builds each service's `production` Dockerfile target and points at the
  managed database instead of local containers.
- A reverse proxy (Nginx/Caddy) for TLS in front of the frontend/backend.
- Basic monitoring: uptime checks on `/health` for each service, and log
  shipping.

None of this is wired up yet — it's flagged here so it isn't a surprise
later, not because it's needed for the current demo.
