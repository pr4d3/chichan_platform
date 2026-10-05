# Frontend Deployment Guide: Cloud Vercel

---

## 1. Overview & System Architecture

- Deploy the Next.js 16 (App Router) + Tailwind CSS v4 frontend to the [Vercel](https://vercel.com) Edge/Serverless platform.
- Establish secure communication between the Vercel-hosted frontend and the Render-hosted backend via HTTPS and CORS.

```text
[Client Browser]
       │
       ▼ (HTTPS)
[Frontend on Vercel: https://chichan.vercel.app]
       │
       ▼ (HTTPS REST API / SSE with Bearer JWT)
[Backend on Render: https://chichan-api.onrender.com]
       │
       ▼ (Transaction Pooler: Port 6543)
[Database on Supabase Cloud (PostgreSQL)]
```

---

## 2. Environment Variable Configuration

> [!IMPORTANT]
> **Runtime Configuration Architecture:** The frontend does **not bake API URLs into build bundles**. Next.js inlines `NEXT_PUBLIC_*` variables directly into static and server code chunks during `next build`, preventing bundles from adapting across preview or production environments. Instead, the application resolves the backend API at runtime via the server-side Route Handler `/api/app-config`. The automated build guard (`scripts/check-frontend.mjs`) enforces this invariant and will abort the build if any `NEXT_PUBLIC_*` API URL is detected.

Configure the following variable in **Settings → Environment Variables** on Vercel:

| Environment Scope | Variable Name | Purpose | Example Value |
| :--- | :--- | :--- | :--- |
| **Production** | `API_BASE_URL` | Base URL of the Production Render Backend | `https://chichan-api.onrender.com/api/v1` |
| **Preview** | `API_BASE_URL` | Base URL for staging/preview backend (or production fallback) | `https://chichan-staging-api.onrender.com/api/v1` |
| **Development** | *(Not required)* | `npm run dev` automatically falls back to `http://127.0.0.1:8000/api/v1` | — |

> [!NOTE]
> `API_BASE_URL` is a server-side only variable (omitting the `NEXT_PUBLIC_` prefix). Changes take effect on the next deployment, as Vercel snapshots function environments per deployment.

---

## 3. CORS Configuration on Backend (Render)

To allow the browser to dispatch cross-origin requests to the Render backend, verify that the `ALLOWED_ORIGINS` variable on the Render Web Service includes your Vercel deployment domain:

- **Variable:** `ALLOWED_ORIGINS`
- **Value:** `https://chichan.vercel.app` (or comma-separated list of production and custom domains). The backend also natively supports `*.vercel.app` regex matching for preview deployments.

---

## 4. Step-by-Step Vercel Deployment Walkthrough

1. **Step 1: Sign in to Vercel**
   - Access [vercel.com](https://vercel.com) and authenticate with your GitHub account.
2. **Step 2: Import Project Repository**
   - Click **Add New...** → **Project**.
   - Select the `chichan_platform` repository.
3. **Step 3: Configure Build & Root Directory**
   - In **Root Directory**, click **Edit** and set it to `frontend`.
   - **Framework Preset:** Vercel automatically detects `Next.js`.
   - **Build Command:** Defaults to `npm run build` (which automatically invokes `node scripts/check-frontend.mjs && next build`).
4. **Step 4: Configure Environment Variables**
   - Add `API_BASE_URL` with your Render backend URL (e.g., `https://chichan-api.onrender.com/api/v1`), scoped to **Production** and **Preview**.
5. **Step 5: Deploy**
   - Click **Deploy**. Vercel will build the Next.js bundle and assign an official deployment URL: `https://[project-name].vercel.app`.

---

## 5. End-to-End Acceptance Checklist

Once Frontend, Backend, and Database are deployed to cloud infrastructure:

- [ ] **1. Page Load & Performance:**
  - Navigating to `https://[project-name].vercel.app` renders the Home Page with sub-second LCP.
- [ ] **2. Authentication & Session Management:**
  - Register a new Parent account at `/register` → Confirm toast notification → Verify record creation in Supabase `users` table.
  - Sign in at `/login` → Verify token storage and redirect to `/profile`.
- [ ] **3. Three-Step Learning Journey:**
  - Navigate to `/courses` → Select a course → Open **Course Intro** → Click "Start Learning" → Enter **Learning Player**.
  - Complete lessons and quizzes → Reach 100% progress → Automatic redirect to **Course Outro** with verifiable certificate generation.
- [ ] **4. AI Roleplay Simulation:**
  - Enter `/game` → Select a scenario (e.g., Digital Stranger or Clinic Doctor) → Initiate chat.
  - Verify token-by-token SSE streaming, live emotion updates, and dynamic score gauge adjustments.
- [ ] **5. Community Forum & Moderation:**
  - Create a discussion thread and post comments using a student account.
  - Sign in with an `ADMIN` account → Verify moderation action triggers → Click "Hide Post" (`HIDDEN`) → Verify thread is removed from public listing.
- [ ] **6. Educator Analytics Dashboard:**
  - Sign in with an `INSTRUCTOR` or `ADMIN` account → Navigate to `/dashboard` → Confirm cohort KPIs and student progress tracking tables load accurately.

---

## 6. Project Documentation Index

The platform documentation is organized systematically:

```text
chichan/
├── docs/
│   ├── overview.md                       # Platform Overview, RBAC Matrix & Architecture
│   ├── deployment/                       # Cloud Deployment Runbooks
│   │   ├── render.md                     # Backend deployment on Render.com
│   │   └── vercel.md                     # Frontend deployment on Vercel
│   ├── refactor_env_independent_build.md # Environment Decoupling Architecture
│   ├── refactor_maintainability_scale.md # 10K -> 1M Users Scale & Maintainability Audit
│   ├── phase1_database/                  # Database Schema Specs (PostgreSQL / Supabase)
│   ├── phase2_backend/                   # FastAPI Backend Architecture & Endpoint Specs
│   ├── phase3_frontend/                  # Next.js UI/UX Specifications & Component Trees
│   └── phase4_ai_roleplay/               # AI Engine Specs (SSE, Context Window, Prompts)
├── backend/                              # FastAPI Service Codebase
└── frontend/                             # Next.js App Router Codebase
```
