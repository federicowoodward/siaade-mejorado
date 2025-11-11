## Dockerized SIAADE

### Prerequisites
- Docker Engine plus the Docker Compose plugin.
- DuckDNS subdomain ready (for example `siadtest.duckdns.org`) and ports 80/443 open on the VPS.

### Environment setup
- Copy `.env.example` to `.env` and fill in Postgres credentials, `DATABASE_URL`, DuckDNS domain/token, the email for Let's Encrypt, plus your JWT access/refresh secrets (and optional TTL overrides).
- `API_CORS_ORIGIN` is only used by the local profile so the Nest API allows calls from `http://localhost:4000`.
- Keep `NODE_ENV=production`; the Compose profiles override it when needed.
- `DUCKDNS_DOMAIN` must include the `.duckdns.org` suffix. The DuckDNS container derives the subdomain at runtime.

### Local profile
- Start: `docker compose --profile local up -d --build`
- Exposed services:
  - Postgres: `localhost:5432`
  - Nest API: `http://localhost:3000`
  - Angular front: `http://localhost:4000`
- Stop: `docker compose --profile local down`
- Reset volumes: `docker compose --profile local down -v`
- Tail logs: `docker compose --profile local logs -f api` (switch `api` for `front` or `postgres-local` as required)

### Production profile (VPS)
- Deploy: `docker compose --profile prod up -d`
- Only Traefik publishes ports (`80`/`443`); API and front stay inside the `siaade_net` network.
- Traefik issues and renews Let's Encrypt certificates via the HTTP challenge and writes `acme.json` to the `traefik_letsencrypt` volume.
- DuckDNS keeps the public IP in sync for `${DUCKDNS_DOMAIN}`.
- Smoke tests:
  - `https://<your_duckdns_domain>/`
  - `https://<your_duckdns_domain>/api/health`
- Key logs: `docker compose --profile prod logs -f traefik` and `docker compose --profile prod logs -f duckdns`

### Extra notes
- In local mode the API should consume `CORS_ORIGIN` to allow requests from the front; in production traffic is same-origin behind Traefik.
- Traefik configuration lives in `traefik/traefik.yml` (static) and `traefik/dynamic.yml` (middlewares). Certificates are stored in the `traefik_letsencrypt` volume.
- `deploy/nginx.conf` is not used anymore; Traefik acts as the reverse proxy and TLS terminator for both services.
- Validate the stack with `docker compose --profile local config` or `docker compose --profile prod config`.

### Variables de entorno
- `DBML_DSN`: cadena de conexión que usa `npm run dbml` para generar el archivo `database.dbml` sin exponer credenciales en texto plano (por ejemplo `postgresql://user:pass@localhost:5432/SIAD?schemas=public`).
