# 0007. The application is deployed by the owner from a Docker image built from this repository

- Status: Accepted
- Date: 2026-10-23

## Context

The owner deploys the portfolio demo together with a server administrator on VPS-style hosting.
Nobody else has access to servers, DNS, hosting or image registries. The repository already has a
multi-stage `Dockerfile` (targets `runner` and `migrator`), `docker-compose.yml`,
`docker-compose.prod.yml` (nginx, certbot, reservation cron) and `/api/health`.

## Recommendation

Deliver a production Docker image definition, compose files, a complete environment variable reference
and a deployment guide, because that lets the owner and the server administrator deploy without asking
anyone.

- **Image:** the existing `Dockerfile`; standalone Next.js output, non-root user, migrations in the
  separate `migrator` target. Images are built on the server or the owner's machine; nothing is pushed
  to GHCR or any other registry.
- **Compose:** `docker-compose.yml` with `docker-compose.prod.yml`.
- **Environment reference:** every variable, required or optional, with format, example and where the
  value comes from.
- **Deployment guide** for the owner and a server administrator, covering migrations, the reservation
  cron, the demo reset (ADR 0010), backups (ADR 0014) and the health check.
- **External accounts:** the Stripe test account, the public webhook endpoint and its signing secret,
  and any OAuth apps belong to the owner and are configured at deployment. The guide lists what to
  register and where.
- **Language:** the guide and the environment reference exist in EN and PL, under `docs/en/` and
  `docs/pl/`.
- Uploads stay on the local filesystem in a persistent volume (`UPLOAD_DIR`).

## Alternatives considered

- **Publishing images to a registry** — ruled out by the owner.
- **Serverless hosting** — needs object storage for uploads and a scheduler; no requirement asks for it.

## Consequences

- Choosing the host and domain, TLS on the real server and provisioning are outside this repository.
  `docker-compose.prod.yml` keeps nginx and certbot as an option the administrator may replace.
- The production overlay must not depend on Mailpit (see ADR 0012).
