# Architectural Refactor: Environment-Independent Builds

> Status: **Phase 1 and Phase 2 fully implemented in codebase** (`dev` branch).  
> Phase 3 (Hardening) depends on dashboard deployment gates documented in Sections 7 & 8.

---

## 1. Context & Objectives

The production stack operates across three distributed cloud layers:
- **Backend:** FastAPI Web Service on Render
- **Frontend:** Next.js 16 (App Router) on Vercel
- **Database:** Supabase Managed PostgreSQL

### The Problem
Previously, the backend API URL was **baked directly into the client bundle at compile time** via the `NEXT_PUBLIC_API_BASE_URL` environment variable. This led to critical architectural flaws:
1. **Environment Freezing:** The compilation environment was indelibly baked into the build artifact. Local builds embedded `http://127.0.0.1:8000`, causing total failure when deployed to remote users.
2. **Missing Variable Inversion:** Omission of the variable during build silently defaulted to hardcoded production URLs.
3. **No Multi-Environment Portability:** A single compiled artifact could not be promoted across staging, preview, and production.
4. **Post-Build Immutability:** Changing environment variables in deployment dashboards had zero effect. Next.js 16 documentation confirms: applications *will no longer respond to changes to build-time environment variables after compilation*.

### Target Objective
*Build once, deploy anywhere.* Guarantee identical build artifacts regardless of build-time environment; resolve all service endpoints strictly at **runtime**; and fail loudly and explicitly when required runtime configurations are missing.

---

## 2. Pre-Refactor Codebase Audit

| # | Location | Mechanism | Architectural Debt |
|---|---|---|---|
| 1 | `frontend/src/lib/api.ts:3` | `NEXT_PUBLIC_API_BASE_URL \|\| NEXT_PUBLIC_API_URL \|\| "https://..."` | Build-time inlining + hardcoded production fallback |
| 2 | `frontend/src/app/(public)/game/[sessionId]/page.tsx` | Duplicate fallback logic for SSE chat | Secondary divergence point needing synchronization |
| 3 | `frontend/.env.local` | `NEXT_PUBLIC_API_BASE_URL` set to `127.0.0.1` | Local compilation inlined localhost into builds |
| 4 | `backend/main.py:37` | Hardcoded literal `https://sex-ed-gray.vercel.app` in CORS | Frontend domain updates required backend code changes |
| 5 | `backend/services/gemini_service.py` | Direct `os.getenv("AI_API_KEY")` bypassing `config.py` | Split configuration sources |
| 6 | `backend/core/config.py` | `load_dotenv()` resolved relative to CWD | Running Uvicorn from repo root loaded defaults (e.g. default `SECRET_KEY`) |
| 7 | `docs/deployment/render.md` | Recommended `JWT_SECRET_KEY` / `JWT_ALGORITHM` | Code looked for `SECRET_KEY` / `ALGORITHM`, causing fallback to insecure defaults |
| 8 | `database/apply_*.py` | Ad-hoc `.env` parsing scripts | Third configuration source risking database drift |
| 9 | `backend/Dockerfile` | Hardcoded port `7860` in CMD | Render injected dynamic `$PORT` was ignored |
| 10 | `docs/deployment/vercel.md` | Documented `NEXT_PUBLIC_SITE_URL` | Dead documentation variable |

Comprehensive auditing confirmed that `frontend/src` contained exactly two references to `NEXT_PUBLIC_*` (#1 and #2).

---

## 3. Evaluated Architectural Approaches

Three distinct architectural models were evaluated against seven evaluation criteria (scored out of 35):

| Strategy | Score | Decision | Rationale |
|---|:---:|:---:|---|
| **A. Runtime Configuration via Route Handler** — Route Handler `/api/app-config` reads runtime env + singleton `getApiBaseUrl()` | **30/35** | **Accepted** | Decouples build entirely; zero additional infrastructure; supports client caching and graceful degradation. |
| **C. Build-time Env with Fail-Fast Guards** | 27/35 | Partial | Adapted into pre-build enforcement scripts (`check-frontend.mjs`) and backend configuration validation. |
| **B. Same-Origin Reverse Proxy via Next.js Route Handler** | 24/35 | Rejected | SSE streams would terminate at Vercel's serverless function timeout (`maxDuration`); introduces function invocation overhead for all traffic. |

### Target Architecture (Strategy A)

```text
[Client Bundle — Zero baked-in API URLs]
   │  fetch("/api/app-config", { cache: "no-store" })  (Run once; cached in-memory + localStorage)
   ▼
[Route Handler: /api/app-config]  (force-dynamic, Cache-Control: no-store)
   │  Reads process.env.API_BASE_URL at RUNTIME (per Vercel Serverless execution)
   ▼
{ "apiBaseUrl": "https://chichan-api.onrender.com/api/v1" }
   │
   ▼
[api.request() + SSE Chat Stream] ──► Direct browser-to-backend request (preserves CORS / Bearer headers)
```

> [!NOTE]
> **Empirical Discovery (Next.js 16 + Turbopack):** Turbopack inlines `process.env.NEXT_PUBLIC_*` even within server-side chunks during compilation. Only non-prefixed variables (`API_BASE_URL`) remain dynamic at runtime on the server. Recommendations suggesting server-side reads of `NEXT_PUBLIC_*` to achieve runtime dynamism are invalid in this Next.js release.

---

## 4. Phase 1 — Frontend Implementation

| File | Changes Made |
|---|---|
| `frontend/src/lib/runtime-config.ts` | **Created.** `getApiBaseUrl(): Promise<string>` — singleton promise cache. Server branch reads `process.env.API_BASE_URL`; browser branch fetches `/api/app-config` once. Implements stale-while-error fallback via `localStorage` to guard against transient network hiccups. |
| `frontend/src/app/api/app-config/route.ts` | **Created.** `GET` handler with `dynamic = "force-dynamic"` and `Cache-Control: no-store`. Resolution precedence: `API_BASE_URL` → legacy fallback (migration period only) → development default (`http://127.0.0.1:8000/api/v1`). Exposes only public endpoint configurations; never leaks secrets. |
| `frontend/src/lib/api.ts` | Removed hardcoded constants. Refactored `request()` to dynamically await `getApiBaseUrl()`. Requires zero call-site refactoring since `get`/`post`/`put`/`delete` helpers are already asynchronous. |
| `frontend/src/app/(public)/game/[sessionId]/page.tsx` | Removed duplicated fallback string. `handleSendMessage` awaits `getApiBaseUrl()`. **SSE streaming maintains direct browser-to-backend communication without routing through Vercel serverless hops.** |
| `frontend/src/proxy.ts` | Added explicit comment prohibiting route interception of `/api/:path*`. |
| `frontend/scripts/check-frontend.mjs` | **Created.** Pre-build CI/CD guard: (1) Rejects `NEXT_PUBLIC_API_*` across `src/`; (2) Rejects unauthorized host literals; (3) Asserts that SSE game room calls rely on `getApiBaseUrl()`. |
| `frontend/package.json` | Updated `build` script: `node scripts/check-frontend.mjs && next build`. |
| `frontend/.env.local` | Removed `NEXT_PUBLIC_API_BASE_URL`. Preserved optional server-only documentation. |
| `frontend/README.md` | Documented runtime configuration mechanics and environment variable usage. |

---

## 5. Phase 2 — Backend Implementation

| File | Changes Made |
|---|---|
| `backend/core/config.py` | Anchored `.env` resolution directly to `backend/` directory. Added `AliasChoices` to `SECRET_KEY` to accept legacy `JWT_SECRET_KEY`. Introduced `ECHO: bool = False`. Implemented `validate_settings()` to verify production configuration health during startup. |
| `backend/main.py` | Registered lifespan startup check calling `validate_settings()`. Removed hardcoded preview URLs from CORS configurations; relies cleanly on `ALLOWED_ORIGINS` and regex domain matching. |
| `backend/core/database.py` | Replaced hardcoded `echo=True` with `echo=settings.ECHO` to eliminate verbose SQL dumping in production logs. |
| `backend/services/gemini_service.py` | Replaced isolated `os.getenv` invocations with centralized `settings.AI_API_KEY` and `settings.GEMINI_MODEL`. |
| `backend/Dockerfile` | Updated CMD to execute via shell wrapper: `sh -c "... --port ${PORT:-7860}"`, honoring dynamic port injection from PaaS providers without requiring image rebuilds. |
| `backend/.dockerignore` | Excluded `.env` files to prevent baking secrets into container images. |
| `database/apply_*.py` | Standardized configuration imports by referencing `core.config.settings`. |

---

## 6. Post-Refactor Environment Variable Matrix

| Variable | Status | Configured In | Resolution Lifecycle |
|---|---|---|---|
| `API_BASE_URL` | **Active** (Replaces `NEXT_PUBLIC_API_BASE_URL`) | Vercel (Production & Preview) | Runtime (Route Handler) |
| `NEXT_PUBLIC_API_BASE_URL` | **Deprecated** (Removed in Phase 3) | To be deleted from Vercel | — |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` | **Removed** (Dead configuration) | None | — |
| `DATABASE_URL` | **Active** (`postgresql+asyncpg://`) | Render + `backend/.env` | Runtime (Service Boot) |
| `SECRET_KEY` | **Active** (Accepts `JWT_SECRET_KEY` alias) | Render + `backend/.env` | Runtime |
| `ALGORITHM` | **Active** (Default: `HS256`) | Render | Runtime |
| `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` | **Active** | Render | Runtime |
| `ALLOWED_ORIGINS` | **Active** (Single source of CORS origins) | Render | Runtime |
| `AI_API_KEY`, `GEMINI_MODEL` | **Active** (Centralized in settings) | Render + `backend/.env` | Runtime |
| `ECHO` | **Active** (Default: `false`) | `backend/.env` (Local debug) | Runtime |
| `PORT` | **Platform Managed** (Injected by Render) | Render Runtime | Process Start |

---

## 7. Phase 3 — Hardening Steps & Quality Gates

The following steps are scheduled after Phase 1 and 2 deployments have stabilized on production:

1. **Vercel Quality Gate:** Configure `API_BASE_URL` on Vercel across **Production** and **Preview** scopes. Verify on a preview branch that `GET /api/app-config` returns the proper backend URL before proceeding.
2. **Remove Fallback Shims:** Strip legacy `NEXT_PUBLIC_*` evaluation and migration fallback constants from `route.ts` and `runtime-config.ts`. A missing `API_BASE_URL` will immediately fail-loud with HTTP 500.
3. **Environment Cleanup:** Delete `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_API_URL` from the Vercel project settings.
4. **Backend Fail-Loud Gate:** Once Render logs show zero startup warnings across consecutive deploy cycles, upgrade `validate_settings()` warnings to explicit `RuntimeError` exceptions for critical misconfigurations.

---

## 8. Deployment Safety & Operational Invariants

- **Safe Progressive Migration:** Legacy client bundles (with baked-in URLs) and modern client bundles (fetching `/api/app-config`) target the exact same Render backend endpoint, ensuring zero user disruption during rolling updates.
- **SECRET_KEY Continuity:** If Render previously configured only `JWT_SECRET_KEY`, the added alias cleanly reads it without rotating the signing key, preventing premature session invalidation.
- **SSE Streaming Invariant:** Game room SSE streams must **never** be proxied through relative paths (`/api/...`) on Vercel to prevent connection truncation by serverless execution timeouts.
- **Verification Invariant:** A complete codebase grep for `onrender.com` or `NEXT_PUBLIC_` within `frontend/src` should yield zero unauthorized hits.

---

## 9. Local Verification Checklist

- [x] `node scripts/check-frontend.mjs` executes cleanly without violations.
- [x] `npm run build` succeeds in a clean environment devoid of `.env` files; `/api/app-config` outputs as dynamic serverless route.
- [x] Client bundles contain zero occurrences of `127.0.0.1`.
- [x] `python -c "import main"` compiles cleanly and executes startup validation without errors.
