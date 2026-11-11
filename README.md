# Project Manager

## Running locally with Docker

Requires Docker with Compose. From the repository root:

```bash
docker compose up --build
```

- Web (Vite): http://localhost:5173
- API (Rails): http://localhost:3000

Three services start:

- **`db`:** PostgreSQL 18 with data in the `db-data` volume. Its port isn't published on the host,
  so it doesn't clash with a local Postgres; connect with `docker compose exec db psql -U postgres`.
- **`api`:** Rails in development (`api/Dockerfile.dev`). It waits for the database healthcheck,
  runs `bin/rails db:prepare` and starts the server on `0.0.0.0:3000`.
- **`web`:** the Vite dev server (`web/Dockerfile.dev`) on `0.0.0.0:5173`, with
  `VITE_API_URL=http://localhost:3000`.

The source code is mounted into the containers, so changes reload. Gems live in the `bundle` volume
and `node_modules` in the `web-node-modules` volume, so they never mix with files on your machine.

```bash
# Tests inside the containers
docker compose exec api bundle exec rspec
docker compose exec web npm run test -- --run

# Rails console
docker compose exec api bin/rails console

# After adding a gem: restart the api (it runs `bundle install` when needed)
docker compose restart api

# After changing package.json: rebuild and recreate the node_modules volume
docker compose up --build -V web

# Stop and delete everything, including the database
docker compose down -v
```

On Linux, the api container runs with user and group ID 1000 so files it writes to `api/log`,
`api/tmp` and `api/storage` aren't owned by root. If `id -u` shows another value, run
`USER_ID=$(id -u) GROUP_ID=$(id -g) docker compose up --build`.

### Without Docker

The API reads its development and test database settings from environment variables, with defaults
for a Postgres published on `localhost:5432`:

| Variable | Default |
| --- | --- |
| `DATABASE_HOST` | `localhost` |
| `DATABASE_PORT` | `5432` |
| `DATABASE_USERNAME` | `postgres` |
| `DATABASE_PASSWORD` | `postgres` |

```bash
cd api && bin/rails server   # http://localhost:3000
cd web && npm run dev        # http://localhost:5173
```

CORS allows `FRONTEND_URL`, which defaults to `http://localhost:5173`.

## Production deployment (API)

The Rails API in `api/` is deployed to Render as a Docker web service using `api/Dockerfile`.
On boot, `bin/docker-entrypoint` runs `bin/rails db:prepare`, and Thruster serves Puma.

- **Database:** a single PostgreSQL database on Neon (`DATABASE_URL`) holds the app tables and the
  Solid Queue, Solid Cache and Solid Cable tables. Use Neon's direct connection string (the host
  without `-pooler`): Rails migrations rely on advisory locks, which don't work through the pooler.
- **Background jobs:** Solid Queue runs inside Puma in async mode (`SOLID_QUEUE_IN_PUMA`), so
  Active Storage purge jobs run without a separate worker service.
- **File storage:** Active Storage uses Cloudflare R2 through the S3 service. The bucket can stay
  private: cover URLs redirect through the API to signed R2 URLs.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `RAILS_MASTER_KEY` | yes | Decrypts `config/credentials.yml.enc` (holds `secret_key_base`). Value of `api/config/master.key`. |
| `DATABASE_URL` | yes | Neon direct connection string, with `sslmode=require`. |
| `SOLID_QUEUE_IN_PUMA` | yes | `true`: runs Solid Queue inside Puma. |
| `FRONTEND_URL` | yes | Frontend origin allowed by CORS, e.g. `https://app.example.com` (no trailing slash). |
| `R2_ENDPOINT` | yes | `https://<account_id>.r2.cloudflarestorage.com` |
| `R2_BUCKET` | yes | R2 bucket name. |
| `R2_ACCESS_KEY_ID` | yes | R2 API token access key (read/write on the bucket). |
| `R2_SECRET_ACCESS_KEY` | yes | R2 API token secret key. |
| `HTTP_PORT` | yes | `10000`: port Thruster listens on, matching Render's default port. |
| `RAILS_MAX_THREADS` | no | Puma threads (default 3). The production pool is fixed at 10 connections, shared with Solid Queue's threads. |
| `RAILS_LOG_LEVEL` | no | Log level (default `info`). |
