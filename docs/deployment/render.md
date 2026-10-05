# Backend Deployment Guide: Cloud Render

---

## 1. Overview & Objectives

- Deploy the Python FastAPI backend application as a managed **Web Service** on [Render](https://render.com).
- Continuous Deployment (CD) via GitHub: commits pushed to the `main` branch trigger automated builds and rolling deployments.
- Secure connection to the cloud-hosted **Supabase PostgreSQL** database via connection pooling.

---

## 2. Technical Specifications

1. **Execution Runtime:**
   - Render automatically provisions the Python runtime via `requirements.txt` or `Dockerfile`.
   - Provides automated HTTPS certificate provisioning: `https://[your-service-name].onrender.com`.
2. **Repository Root Directory:**
   - The repository is organized into distinct subdirectories (`backend/`, `frontend/`, `docs/`).
   - Configure **Root Directory** as `backend` on Render so that the service context is properly isolated.
3. **Build & Start Commands:**
   - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 3. Environment Variable Configuration

Configure the following variables in the **Environment** tab on the Render Dashboard. All configuration values are loaded strictly at **runtime** when the Uvicorn process initializes:

| Variable Name | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase Transaction Pooler connection string. **Must use the async driver scheme: `postgresql+asyncpg://`**. (`statement_cache_size=0` is automatically handled in `core/database.py`). | `postgresql+asyncpg://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| `SECRET_KEY` | High-entropy secret key used to sign and verify JWT tokens (minimum 32 characters, recommended 64-char hex string). Accepts `JWT_SECRET_KEY` as a backward-compatible alias. | `[generated_random_64_char_secret_string]` |
| `ALGORITHM` | JWT signing algorithm (default: `HS256`). | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access Token lifespan in minutes (default: `60`). | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh Token / user session validity period in days (default: `30`). | `30` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed Frontend origins for CORS. Supports regex matching for preview deployments. Set to `*` for testing (disables credentialed cookies). | `https://chichan.vercel.app` |
| `AI_API_KEY` | Google Gemini API Key (required for AI Roleplay simulations and evaluation). | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini model identifier for roleplay dialogue and evaluations (default: `gemini-flash-lite-latest`). | `gemini-flash-lite-latest` |
| `ECHO` | Toggles SQLAlchemy SQL query debugging logs (default: `false`). | `false` |

> [!NOTE]
> Deprecated variables that are no longer referenced by the codebase: `JWT_ALGORITHM` (standardized to `ALGORITHM`), `ENVIRONMENT`, and `PYTHON_VERSION` (superseded by Docker / native runtime defaults).

> [!IMPORTANT]
> During startup, the backend invokes `validate_settings()` in `core/config.py`. It outputs **CRITICAL** or **WARNING** log diagnostics if `SECRET_KEY` retains its default placeholder, `DATABASE_URL` uses an invalid driver scheme, `AI_API_KEY` is omitted, or `ALLOWED_ORIGINS` uses wildcard mode.

---

## 4. Step-by-Step Deployment Walkthrough

1. **Step 1: Sign in and Create Web Service**
   - Access [dashboard.render.com](https://dashboard.render.com) and authenticate with your GitHub account.
   - Click **New +** in the upper right corner and select **Web Service**.
2. **Step 2: Connect GitHub Repository**
   - Select the `chichan_platform` repository from the repository list.
3. **Step 3: Configure Service Parameters**
   - **Name:** Assign an identifier (e.g., `chichan-api`).
   - **Region:** Select `Singapore` (optimal latency for users in Southeast Asia).
   - **Branch:** Select `main` (or designated release branch).
   - **Root Directory:** Enter `backend`.
   - **Runtime:** Select `Python 3`.
   - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Select Free tier (or appropriate compute tier).
4. **Step 4: Populate Environment Variables**
   - In the **Environment Variables** section, enter the Key-Value pairs specified in Section 3.
5. **Step 5: Deploy**
   - Click **Create Web Service**.
   - Render initiates the build process, installs dependencies, and launches the application.

---

## 5. Verification & Acceptance Criteria

- [ ] Render service status transitions to **Live** with a green indicator.
- [ ] Navigating to `https://[your-service-name].onrender.com/docs` opens the interactive Swagger UI displaying all API endpoints.
- [ ] Calling the health check endpoint `GET /` returns `{"message": "ChiChan Platform API is running!", "status": "healthy"}`.
- [ ] Registering an account via `POST /api/v1/auth/register` succeeds and creates a corresponding record in the Supabase `users` table.
