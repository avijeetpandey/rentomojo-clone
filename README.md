# Rentomojo Clone

A modern, full-stack clone of the Rentomojo rental marketplace, built as a portfolio-grade reference implementation:

- **Desktop client** — Electron + React + TypeScript + Vite + TailwindCSS + Shadcn UI (GitHub-themed light/dark).
- **API** — Node.js + TypeScript + Express + Prisma + PostgreSQL with JWT auth and structured logging.
- **Infra** — Podman-first containers (`Containerfile` + `podman-compose`), with raw Kubernetes manifests for production.


---

## Repository layout

```
rentomojo-clone/
├── backend/            # Express + Prisma API (TypeScript)
│   ├── src/
│   │   ├── config/         # Env loading
│   │   ├── controllers/    # HTTP handlers      
│   │   ├── services/       # Business logic    
│   │   ├── repositories/   # Prisma access      
│   │   ├── middleware/     # Auth, error handler
│   │   ├── routes/         # Route mounting     
│   │   ├── utils/          # Logger, HttpError
│   │   ├── app.ts          # Express app factory
│   │   └── server.ts       # HTTP bootstrap
│   ├── prisma/             # Schema + seed
│   ├── tests/              # Jest + Supertest
│   └── Containerfile
├── client/             # Electron + React + Vite
│   ├── src/                # React app
│   ├── electron/           # Electron main + preload
│   └── Containerfile       # Static-bundle image (nginx)
├── infra/
│   └── k8s/                # Kubernetes manifests 
├── compose.yaml        # podman-compose stack (db + backend + client)
├── Makefile            # `make run` one-click bootstrap
└── README.md
```

---

## Architecture overview

```
┌──────────────────────┐         HTTPS/JSON         ┌──────────────────────┐
│  Electron + React    │ ─────────────────────────▶ │  Express API         │
│  (client/)           │ ◀───────────────────────── │  (backend/)          │
└──────────────────────┘                            └──────────┬───────────┘
        ▲                                                      │ Prisma
        │ Toasts / Zustand state                               ▼
        │                                              ┌──────────────────┐
        │                                              │  PostgreSQL 16   │
        └──────────── GitHub-themed UI ────────────────│  (db service)    │
                                                       └──────────────────┘
```

- **Layered backend**: `routes → controllers → services → repositories (Prisma)`.
- **Stateless auth**: JWTs issued at `/login`, validated by middleware on all other routes (Phase 2).
- **Centralized error handling**: `HttpError` class + Zod validation surface consistent JSON errors.
- **Structured logging**: `pino` + `pino-http` emit JSON logs in prod, pretty logs in dev.
- **Frontend theming**: Tailwind + CSS variables that map to GitHub's official color tokens, with a `dark` class toggle (Phase 3).

---

## Prerequisites

| Tool             | Version (tested) | Notes                                                          |
| ---------------- | ---------------- | -------------------------------------------------------------- |
| Node.js          | 20.x             | For local dev (containers ship with their own node).           |
| npm              | 10.x             | Bundled with Node.                                             |
| Podman           | 5.x              | `brew install podman` on macOS.                                |
| podman-compose   | 1.x              | `pip install podman-compose` or `brew install podman-compose`. |
| GNU Make         | any              | Pre-installed on macOS/Linux.                                  |

> Using Docker instead? Set `COMPOSE=docker compose` when invoking make, e.g. `make run COMPOSE="docker compose"`.

---

## One-click bootstrap

From the repository root:

```bash
make run
```

This will:

1. Build the `backend` and `client` container images from their `Containerfile`s.
2. Start PostgreSQL 16, wait for it to be healthy.
3. Start the Express API on **http://localhost:4000** (health probe at `/health`).
4. Start the static client bundle on **http://localhost:5173**.

Verify everything is up:

```bash
curl http://localhost:4000/health
# → {"status":"ok","service":"rentomojo-backend",...}

open http://localhost:5173            # web view of the React app
```

Tear down:

```bash
make down        # stop containers (keep DB volume)
make clean       # stop containers AND drop the DB volume
```

## Kubernetes deployment

Manifests live in `infra/k8s/` (tested with kubectl 1.29 + nginx ingress controller).

```bash
# Edit infra/k8s/secret.yaml — replace base64 stub values with real secrets first!
# Edit infra/k8s/backend/deployment.yaml and client/deployment.yaml — set your registry image.

make k8s-apply   # applies all resources in dependency order
make k8s-status  # shows pods, services, ingress
make k8s-delete  # tears down the entire namespace
```

See `infra/k8s/README.md` for the full apply order, scaling, and TLS setup.

---

## Local development (without containers)

The Makefile also supports a hybrid mode — Postgres in a container, backend & client running natively for fast reloads:

```bash
make install        # install backend + client npm deps
make db-only        # run just Postgres on :5432

# in two terminals:
make dev-backend    # tsx watch — http://localhost:4000
make dev-client     # vite       — http://localhost:5173

# or launch the Electron shell:
make dev-electron
```

Backend environment variables are read from `backend/.env` (copy `.env.example`). Client variables from `client/.env`.

---

## Testing

```bash
make test            # runs backend (Jest) + client (Vitest)
make test-backend
make test-client
```

---

## Container & deployment notes

- **Containerfile**, not Dockerfile — built with Podman, but fully compatible with Docker BuildKit syntax (`# syntax=docker/dockerfile:1.7`).
- Backend image is multi-stage (`deps → build → runtime`), runs as a non-root `app` user under `tini`.
- Client image builds the Vite bundle and serves it via nginx so the same artifact can be deployed both as a web fallback and packaged inside the Electron shell.
- Kubernetes manifests live in `infra/k8s/` (populated in Phase 6 with `Deployment`, `Service`, `ConfigMap`, `Secret`, and `Ingress` objects).

---
