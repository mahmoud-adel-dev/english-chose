# English Coach — Architecture & Operational Guidelines

This document serves as the single source of truth for the architecture, security boundaries, database rules, and deployment procedures for the English Coach project. **All developers and AI assistants must read and adhere to these guidelines before making modifications.**

---

## 1. Production Architecture Overview

- **Repository:** `https://github.com/mahmoud-adel-dev/english-chose`
- **Mobile Client:** Flutter / Dart (Android, Web) located in `apps/mobile`
- **Backend API:** Next.js 15 (App Router) hosted on Vercel located in `apps/backend`
- **Production API URL:** `https://english-chose.vercel.app/api`
- **Primary Cloud Database:** Neon Cloud Serverless PostgreSQL (`neondb`)
- **ORM & Data Access:** Prisma Client (`apps/backend/prisma/schema.prisma`)
- **AI Inference Engine:** Google Gemini API (`@google/generative-ai`), managed entirely server-side via `AiTaskRouter`
- **Authentication:** Stateless JWT Bearer tokens issued and validated server-side by the Next.js API

```
+-------------------------------------------------------------+
|                     Flutter Mobile Client                   |
|                   (Android / iOS / Web)                     |
+-------------------------------------------------------------+
                               |
                               | HTTPS / JWT Bearer Tokens
                               v
+-------------------------------------------------------------+
|                   Next.js 15 Backend API                    |
|             (https://english-chose.vercel.app/api)          |
+-------------------------------------------------------------+
                |                               |
       Prisma Serverless               Gemini API
       Pooled Connection             (Server-side Key)
                |                               |
                v                               v
+--------------------------------+   +------------------------+
|    Neon PostgreSQL Cloud DB    |   |     Google Gemini      |
|  (ep-xyz-pooler.neon.tech)     |   |   (gemini-2.0-flash)   |
+--------------------------------+   +------------------------+
```

---

## 2. Non-Negotiable Security & Architectural Boundaries

1. **Zero Direct Database Access from Mobile:**
   - The Flutter mobile application must **NEVER** connect directly to Neon PostgreSQL or any database server.
   - All persistence, user progress, session history, and evaluation records must pass through authenticated HTTP endpoints on the Vercel backend.

2. **Centralized Production API Configuration:**
   - Flutter must default to `https://english-chose.vercel.app/api` via `apps/mobile/lib/config/api_config.dart`.
   - Never hardcode `localhost:3000`, `127.0.0.1:3000`, `10.0.2.2`, LAN IP addresses, or port `5433` in mobile production code.
   - Local development override is supported strictly through compile-time environment flags:
     ```bash
     flutter run --dart-define=API_BASE_URL=http://<host>:<port>/api
     ```

3. **Server-Side Secret Isolation:**
   - `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `JWT_SECRET`, and `GEMINI_API_KEY` are strictly server-side environment variables configured on Vercel.
   - Never commit `.env` files, credentials, or secrets to Git.
   - Never print or expose connection strings or API keys in client bundles, logs, or error responses.

4. **Decommissioned Infrastructure:**
   - The former local PostgreSQL instance (`127.0.0.1:5433`) is decommissioned and must not be resurrected or used.

5. **Data Protection & Migration Safety:**
   - **NEVER** run destructive commands against Neon production (`DROP TABLE`, `TRUNCATE`, un-scoped `DELETE`).
   - **NEVER** run `npx prisma migrate reset` or seed scripts with hardcoded sample credentials against Neon production.
   - Prisma migrations must be applied using the direct unpooled connection (`DATABASE_URL_UNPOOLED`).

---

## 3. Database & Connection Pooling Configuration

Serverless platforms like Vercel create ephemeral container instances that can quickly exhaust PostgreSQL connections. The following pattern is enforced:

- **Pooled URL (`DATABASE_URL`):** Connects through Neon's PgBouncer connection pooler (`-pooler` subdomain). Used by Next.js request handlers and runtime queries.
- **Direct URL (`DATABASE_URL_UNPOOLED`):** Direct TCP connection to Neon compute. Configured under `directUrl` in `prisma/schema.prisma` exclusively for schema migrations.
- **Prisma Client Caching:** In `apps/backend/src/lib/prisma.ts`, the Prisma client is unconditionally cached on `globalThis` to preserve connection reuse across warm serverless Lambda invocations.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}
```

---

## 4. AI Engine & Task Routing Resilience

The backend AI orchestration layer (`apps/backend/src/lib/ai/task-router.ts`) provides fault-tolerant routing for language coaching:

1. **Database-Configured Routing:** If `AiTaskRouting` rows are configured in the database, the router evaluates the primary model and falls back to secondary models upon errors or rate limits.
2. **Server Environment Gemini Fallback:** If `AiTaskRouting` has not yet been seeded in Neon DB, the router automatically attempts inference using the server's `GEMINI_API_KEY` (e.g. `gemini-2.0-flash`).
3. **Deterministic Mock Fallback:** If cloud AI services are temporarily unreachable, the router seamlessly falls back to structured internal adapters (`MockAiProviderAdapter`), preventing 500 crashes and preserving uninterrupted user training sessions.

---

## 5. Development & Deployment Procedures

### Backend Build & Verification
```bash
cd apps/backend
npm install
npm run build
```
Verify that all 16+ API routes compile statically and dynamically without type or bundling errors.

### Mobile Build & Verification
```bash
cd apps/mobile
flutter clean
flutter pub get
flutter analyze
flutter test
```
Verify that all analyzer warnings/errors and unit/widget tests pass cleanly.

### Deploying Changes to Production
1. Commit changes to Git repository:
   ```bash
   git add .
   git commit -m "feat/fix: descriptive update"
   git push origin main
   ```
2. Vercel automatically detects commits to `main` and deploys the updated Next.js API.
3. Verify live endpoints at `https://english-chose.vercel.app/api`.

