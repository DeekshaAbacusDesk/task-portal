# TaskPortal — Scalable Task Management System

A full-stack task manager with a layered Node.js/Express API, a React client, and real-time updates over WebSockets. Tasks can be viewed as a paginated **list** or a drag-and-drop **board**, and an **analytics** dashboard summarises the data live.

| | |
|---|---|
| **Backend** | Node.js · Express 5 · TypeScript · Socket.IO · zod · pino · JWT |
| **Frontend** | React 19 · Vite · TypeScript · TanStack Query · React Router · CSS Modules |
| **Storage** | In-memory, behind a repository interface (swap-in point for a real database) |
| **Tests** | Vitest + Supertest — 27 backend tests (unit + HTTP integration) |

---

## Contents

1. [Features](#features)
2. [Setup](#setup)
3. [Environment variables](#environment-variables)
4. [API reference](#api-reference)
5. [Real-time events](#real-time-events)
6. [Architecture](#architecture)
7. [Architecture decisions](#architecture-decisions)
8. [Trade-offs](#trade-offs)
9. [Scaling this in production](#scaling-this-in-production)
10. [What I would improve next](#what-i-would-improve-next)

---

## Features

**Assessment requirements**

- REST API: create, list (paginated), update (title, description, status), delete, filter by status, search by title
- Each task has `id`, `title`, `description`, `status` (`pending` · `in-progress` · `completed`) and an auto-generated `createdAt`
- Layered architecture: routes → controllers → services → repositories
- Centralised error handling, structured request logging, rate limiting, `.env` configuration
- Socket.IO: every connected client sees status changes (and creates, edits and deletes) without refreshing
- React client with paginated list, create/edit, status filter, search, live updates, and explicit loading / empty / error states
- Backend unit and integration tests

**Additions**

- **Login** — JWT authentication protects the REST API *and* the WebSocket handshake
- **Task dates** — *Assigned on* (creation), optional *Due date*, and *Completed on* (stamped by the server when a task is completed, cleared if it is reopened), with **Overdue** / **Due today** flags
- **List and Board views** — a kanban board with one column per status; drag a card to change its status (keyboard and touch users use the card's *Move to* menu). The chosen view is kept in the URL
- **Tab counts** — each status tab shows how many tasks match the current search
- **Analytics** — totals per status, completion rate, status breakdown, tasks created per day, recent activity; all update live
- **Responsive** — sidebar on desktop, icon rail on tablets, bottom tab bar and bottom-sheet dialogs on phones

---

## Setup

### 1. Prerequisites

- **Node.js and npm.** Developed and tested on Node 23.11 and npm 10.9.
- **Git**
- **Free ports 4000 and 5173.** Both can be changed; see [Troubleshooting](#troubleshooting).

### 2. Clone the repository

```bash
git clone https://github.com/DeekshaAbacusDesk/task-portal.git
cd task-portal
```

### 3. Create the environment files

Each app ships a `.env.example`. Copy it to `.env`; the defaults work for local development as they are.

```bash
# macOS / Linux / Git Bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

```powershell
# Windows PowerShell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

**`server/.env`**

```dotenv
NODE_ENV=development
PORT=4000
LOG_LEVEL=info

# Comma-separated list of allowed browser origins
CORS_ORIGIN=http://localhost:5173

# Rate limiting (per IP)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10

# Auth — use a long random secret outside local development
JWT_SECRET=change-me-to-a-long-random-string-of-32-chars-min
JWT_EXPIRES_IN=1h

# Demo account (the password is bcrypt-hashed in memory at startup)
DEMO_USER_NAME=Demo User
DEMO_USER_EMAIL=demo@taskportal.dev
DEMO_USER_PASSWORD=Password123!
```

**`client/.env`**

```dotenv
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
```

`.env` files are git-ignored; only the `.env.example` templates are committed. Outside local development, replace `JWT_SECRET` and the demo credentials. One way to generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 5. Start both apps (two terminals)

```bash
# Terminal 1 — API on http://localhost:4000
cd server
npm run dev
```

```bash
# Terminal 2 — client on http://localhost:5173
cd client
npm run dev
```

The API logs `Server listening` with port 4000 when it is ready; Vite prints the local URL.

### 6. Sign in

Open **http://localhost:5173** and sign in with the demo account from `server/.env`:

| Email | Password |
|---|---|
| `demo@taskportal.dev` | `Password123!` |

You land on **Analytics**. Open **Tasks** to create tasks and switch between the **List** and **Board** views. To see real-time updates, open the app in a second browser window and change a task's status in one of them.

Storage is in-memory, so the app starts with no tasks and is emptied whenever the API restarts.

### 7. Run the tests (optional)

```bash
cd server
npm test
```

### Production build

```bash
# API: compile TypeScript, then run the compiled output
cd server
npm run build
npm start          # set NODE_ENV=production and a real JWT_SECRET in server/.env first

# Client: static files in client/dist, ready for any static host or CDN
cd client
npm run build
npm run preview    # serves the build locally at http://localhost:4173 to check it
```

When serving the client from a different address, add that origin to `CORS_ORIGIN` on the server. Vite builds `VITE_*` values into the bundle, so set them before running `npm run build`.

### Troubleshooting

| Symptom | Fix |
|---|---|
| API exits with `Invalid environment configuration` | `server/.env` is missing or a value is invalid. The message names each field, e.g. `JWT_SECRET` shorter than 32 characters. |
| `EADDRINUSE` on start | Another process is using the port. Change `PORT` in `server/.env`, then update both `VITE_*` URLs in `client/.env` to match. |
| Browser console shows a CORS error | `CORS_ORIGIN` must exactly match the address the client is served from, including the port. |
| `Too many login attempts` | The login rate limit is 10 attempts per minute per IP. Wait a minute, or raise `AUTH_RATE_LIMIT_MAX` locally. |
| Signed out after restarting the API | Expected: the in-memory demo user gets a new ID on every start, so old tokens no longer match. Sign in again. |
| A `client/.env` change has no effect | Restart `npm run dev`; Vite reads `.env` only at startup. |

### Scripts

| Location | Command | What it does |
|---|---|---|
| `server/` | `npm run dev` | API with auto-reload (tsx watch) |
| | `npm test` | Run the test suite |
| | `npm run build` / `npm start` | Compile to `dist/` / run the compiled build |
| | `npm run typecheck` | Type-check without emitting |
| `client/` | `npm run dev` | Vite dev server |
| | `npm run build` | Type-check and build to `dist/` |
| | `npm run preview` | Serve the production build locally |

---

## Environment variables

Reference for the files created in [step 3](#3-create-the-environment-files). The API **validates its environment with zod at startup and refuses to boot** if anything is missing or invalid, so a misconfigured deploy fails immediately rather than at the first request.

**`server/.env`**

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | `development` · `test` · `production` |
| `PORT` | `4000` | HTTP and WebSocket port |
| `LOG_LEVEL` | `info` | pino log level |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated list of allowed browser origins |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window |
| `RATE_LIMIT_MAX` | `100` | Requests per IP per window, all API routes |
| `AUTH_RATE_LIMIT_MAX` | `10` | Login attempts per IP per window |
| `JWT_SECRET` | — (required, ≥ 32 chars) | Token signing secret |
| `JWT_EXPIRES_IN` | `1h` | Token lifetime |
| `DEMO_USER_NAME` / `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` | — | The demo account; the password is bcrypt-hashed in memory at startup |

**`client/.env`**

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000/api/v1` | Base URL of the REST API |
| `VITE_SOCKET_URL` | `http://localhost:4000` | Socket.IO server (the API's origin) |

---

## API reference

Base path: `/api/v1`. Everything except `/health` and `/auth/login` requires `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/auth/login` | `{ email, password }` → `{ token, user }` |
| `GET` | `/auth/me` | The authenticated user |
| `GET` | `/tasks` | List tasks — query: `page` (default 1), `limit` (1–100, default 10), `status`, `search` |
| `GET` | `/tasks/:id` | One task |
| `POST` | `/tasks` | Create — `{ title, description?, status?, dueDate? }` → `201` |
| `PATCH` | `/tasks/:id` | Partial update of `title`, `description`, `status`, `dueDate` (`null` clears it) |
| `DELETE` | `/tasks/:id` | Delete → `204` |
| `GET` | `/analytics/summary` | Aggregates — query: `days` (1–90, default 14) |

**Task**

```json
{
  "id": "6f1c…",
  "title": "Write README",
  "description": "Setup, architecture, trade-offs",
  "status": "in-progress",
  "dueDate": "2026-10-05",
  "completedAt": null,
  "createdAt": "2026-10-02T09:15:00.000Z",
  "updatedAt": "2026-10-02T11:40:00.000Z"
}
```

`dueDate` is a calendar date (`YYYY-MM-DD`), not a timestamp — a deadline is a day, and storing it without a time zone means it can never shift by one day for users in other zones. `id`, `createdAt`, `updatedAt` and `completedAt` are server-owned; request bodies that include them are rejected.

**List response**

```json
{
  "data": [ /* tasks, newest first */ ],
  "meta": {
    "page": 1, "limit": 10, "total": 23, "totalPages": 3,
    "statusCounts": { "all": 23, "pending": 12, "in-progress": 6, "completed": 5 }
  }
}
```

`statusCounts` follows the `search` filter but ignores the `status` filter, so every tab can show its own total from one request.

**Errors** — every failure has the same shape and an HTTP status that matches it:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed",
             "details": [{ "field": "title", "message": "Title is required" }],
             "requestId": "3b0e…" } }
```

| Status | `code` | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed JSON |
| 401 | `UNAUTHORIZED` | Missing, invalid or expired token; wrong credentials |
| 404 | `NOT_FOUND` | Unknown task or route |
| 422 | `VALIDATION_ERROR` | Body or query fails validation (with per-field `details`) |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Anything unexpected — details are logged, never sent to the client |

`requestId` also appears in the `X-Request-Id` response header and on every log line for that request.

---

## Real-time events

Clients connect with `io(SOCKET_URL, { auth: { token } })`; connections without a valid JWT are rejected during the handshake.

| Event | Payload | Emitted when |
|---|---|---|
| `task:created` | `Task` | A task is created |
| `task:updated` | `Task` | Any field changes |
| `task:status_changed` | `{ task, previousStatus }` | The status changes (sent in addition to `task:updated`) |
| `task:deleted` | `{ id }` | A task is deleted |

How the client applies them (`client/src/realtime/useTaskRealtime.ts`):

- `task:updated` patches the task in place in every cached list and board column — instant, no request.
- Status changes, creates and deletes change which tasks belong on which page, tab or column, so those trigger a refetch: the server stays the source of truth for membership and counts.
- Refetches are **coalesced** (250 ms window), so a burst of events costs one request per view rather than one per event.
- After a reconnect the client refetches, catching up on anything missed while offline.
- Handlers are idempotent, so receiving your own changes back is harmless.

---

## Architecture

```
                         ┌──────────────────────── server ─────────────────────────┐
  React client           │                                                         │
 ┌───────────────┐ HTTP  │  routes ─► controllers ─► services ─► repositories       │
 │ TanStack Query├──────►│  (wiring)  (HTTP in/out,   (business   (storage          │
 │ cache         │       │             zod parsing)   rules)      interface)        │
 │               │       │                               │                         │
 │               │  WS   │                               │ publish                 │
 │               │◄──────┤  realtime/socket.ts ◄── events/eventBus.ts               │
 └───────────────┘       │   (JWT handshake,       (typed in-process pub/sub)      │
                         │    broadcast)                                           │
                         └─────────────────────────────────────────────────────────┘
```

A request flows down the layers; a write also publishes a domain event, which the Socket.IO layer broadcasts. **Services never import Socket.IO** — real-time delivery is a subscriber, not a dependency of the business logic.

```
server/src/
  config/env.ts          zod-validated environment — fail fast on bad config
  domain/                Task, User and analytics types; the status list
  repositories/          TaskRepository / UserRepository interfaces + in-memory implementations
  services/              TaskService, AuthService, AnalyticsService — business rules, publish events
  controllers/           HTTP adapters: parse input with zod, call a service, shape the response
  routes/                URL → controller wiring, auth and rate-limit middleware per router
  middlewares/           authenticate, errorHandler, notFound, rateLimiter, requestLogger
  validators/            zod schemas for bodies and queries
  events/eventBus.ts     typed pub/sub between services and transports
  realtime/socket.ts     Socket.IO server: handshake auth, event fan-out
  container.ts           composition root — the only place that knows concrete classes
  app.ts                 builds the Express app without listening (used directly by tests)
  server.ts              process entry: HTTP + WS server, graceful shutdown

client/src/
  api/                   axios instance, error normalisation, one module per resource
  hooks/                 TanStack Query hooks (queries, mutations, board columns), URL filters, cache helpers
  realtime/              socket factory + the hook that keeps the query cache in sync
  context/               auth session (token, user, logout on any 401)
  routes/                router, protected / public-only guards
  pages/                 Analytics, Tasks, Login
  components/            layout, tasks (list, board, dialogs), analytics, ui primitives
  styles/                design tokens (CSS custom properties) and global styles
```

---

## Architecture decisions

**Repository interface over in-memory storage.** Services depend on `TaskRepository`, not on a `Map`. Filtering, pagination and aggregation live in the repository so a database implementation can push them into SQL (`WHERE`, `LIMIT/OFFSET`, `GROUP BY`). Moving to Postgres is a new class plus one line in `container.ts`.

**A composition root instead of a DI framework.** `container.ts` builds everything by hand. Dependencies stay explicit and tests construct exactly what they need — the integration tests build a real app with a test config and no network port.

**Domain events decouple real-time from business logic.** `TaskService` publishes to a typed `EventBus`; `realtime/socket.ts` subscribes. Scaling real-time out (Redis adapter, a message broker) changes the transport, not the services.

**Validation at the edge with zod.** Controllers parse every body and query; a `ZodError` becomes a 422 with per-field details in one place. Create/update schemas are strict, so clients cannot set server-owned fields. The same library validates environment variables at boot.

**One error contract.** Operational errors are `AppError` subclasses with a status and a stable machine-readable `code`; anything else is treated as a bug — logged in full, returned as a generic 500. Express 5 forwards rejected promises to the error handler, so controllers carry no `try/catch` boilerplate.

**Structured logging with correlation IDs.** pino emits JSON in production (ready for CloudWatch or any log shipper) and pretty output locally. Each request gets an ID — an upstream `X-Request-Id` is honoured — returned in the response header and error body. `Authorization` headers and passwords are redacted.

**Security basics.** helmet, CORS restricted to configured origins, a 100 kB body limit, a global rate limit plus a tighter one on login, bcrypt-hashed passwords, and a constant-time-ish login path (unknown emails still run a bcrypt compare) with one error message for "wrong email" and "wrong password".

**Server state in TanStack Query; filters in the URL.** The query cache owns server data — loading and error states, retries, keeping the previous page on screen while the next loads. View, status, search and page live in the query string, so any view is shareable, survives a refresh and works with the back button. No Redux: there is almost no client-only state left once those two are in place.

**The board reuses the list endpoint.** Each column is an infinite query on `GET /tasks?status=…`, loading 20 cards at a time with *Load more*, so a large *Completed* column never delays *Pending*. No board-specific API was needed.

**Optimistic status moves.** Dragging a card updates the cache immediately and rolls back if the server rejects the change; the server's response then refreshes every view.

**A thin API layer in the client.** Components never call axios. One axios instance attaches the token, normalises every failure into an `ApiError` (`status`, `code`, `message`, `details`), and ends the session on any 401.

**Accessible by construction.** Real buttons and labelled inputs; icon-only controls have `aria-label`s; dragging has a keyboard/touch equivalent (*Move to*) and a live-region announcement; status is never shown by colour alone; text meets WCAG contrast; tap targets are at least 40–44 px on phones; form inputs are 16 px on phones so iOS doesn't zoom. The chart palette was checked for lightness band and colour-vision-deficiency separation, and every chart has a text or table equivalent.

---

## Trade-offs

| Decision | Cost | Why it's acceptable here |
|---|---|---|
| In-memory storage | Data is lost on restart; one process only | The brief allows it; the repository interface makes it a swap, not a rewrite |
| Single demo user from `.env` | No sign-up, roles or per-user data | Proves the auth flow end to end without building user management |
| JWT in `localStorage` | Readable by any script on the page (XSS risk) | Simple for a SPA demo; production should use an `httpOnly`, `SameSite` cookie |
| Socket token checked only at connect | An open socket outlives its token's expiry | Short token lifetime limits it; production would re-validate or disconnect on expiry |
| Broadcast to every client | Everyone receives every event | Fine for one shared board; multi-tenant needs rooms per workspace |
| Offset pagination | Pages can shift when tasks are added or removed between requests | Simple and fine at this scale; cursor pagination is the production answer |
| In-memory rate-limit store | Limits are per instance, not global | Correct for one instance; needs a shared store when scaled out |
| Daily analytics use UTC days | A task created near midnight may land on a neighbouring local day | Stated on the chart; per-user time zones are a later refinement |
| Last write wins | Concurrent edits to the same field overwrite each other | Mitigated: the client sends only changed fields; versioning would close the gap |
| No Docker | One more manual step to run | Excluded by agreement for this submission |

---

## Scaling this in production

On AWS:

- **Run stateless API containers** on ECS Fargate behind an Application Load Balancer, with auto-scaling on CPU and request count. The app already keeps no per-request state outside the database, except the two pieces below.
- **Put WebSockets on Redis.** Add the Socket.IO Redis adapter on ElastiCache so an event published on one instance reaches clients connected to any instance. The client already forces the `websocket` transport, so no sticky sessions are needed.
- **Use a shared rate-limit store.** Back `express-rate-limit` with Redis so limits apply globally; keep AWS WAF in front for coarse abuse protection.
- **Database:** RDS Postgres (or Aurora) behind the existing repository interface:
  - an index on `(status, created_at DESC)` for the filtered list,
  - `pg_trgm` or full-text search for title search instead of `ILIKE '%…%'`,
  - cursor (keyset) pagination on `(created_at, id)` for stable pages,
  - read replicas for listing and analytics,
  - pre-aggregated or materialised analytics instead of computing per request.
- **Make events reliable with an outbox.** Write the event in the same transaction as the task change, and have a relay publish it to SNS/SQS or EventBridge. Real-time fan-out, notifications and an audit log then consume the same stream, and no event is lost if a process dies between the commit and the publish.
- **Serve the frontend from S3 + CloudFront.** The client is a static build; immutable hashed assets get long cache lifetimes.
- **Keep secrets in Secrets Manager or SSM Parameter Store,** injected as environment variables. The zod config validation still applies.
- **Observability:** JSON logs to CloudWatch Logs with the request ID as the correlation key, OpenTelemetry traces (X-Ray), and dashboards and alarms on p95 latency, 5xx rate, WebSocket connection count and event-bus lag.
- **Delivery:** a CI pipeline running type-check, tests and build on every PR; blue/green or rolling ECS deploys. Graceful shutdown on `SIGTERM` (already implemented) drains in-flight requests and sockets during deploys.
- **Real authentication:** an identity provider (Cognito or OIDC) with short-lived access tokens, refresh tokens in `httpOnly` cookies, and Socket.IO rooms per workspace or user so events only reach people allowed to see them.

---

## What I would improve next

1. Postgres repository with migrations, then cursor pagination
2. Optimistic concurrency — a `version` field, with `409 Conflict` on stale updates
3. Users, assignees and workspaces, with per-workspace socket rooms
4. Cookie-based auth with refresh tokens; disconnect sockets when a token expires
5. Frontend tests (Vitest + Testing Library) and end-to-end tests (Playwright) in CI
6. OpenAPI spec generated from the zod schemas
7. Board ordering within a column (drag to reorder, persisted rank)
8. Docker Compose for one-command local setup
