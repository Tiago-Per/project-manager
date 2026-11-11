# Project Manager

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
