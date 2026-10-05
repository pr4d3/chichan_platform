# Feature Specification 01: Authentication & Authorization (Frontend UI/UX)

---

## 1. Scope & Technical Objectives

- Build an accessible, clean registration and sign-in interface catering to both **Parents** and **Adolescents / Children**.
- Implement an intuitive, visual demographic selection step (Role Selector Cards) during onboarding.
- Manage client-side session states, token lifecycles, and route protection guards.

---

## 2. Next.js Routing Architecture

```text
frontend/src/app/
├── (auth)/
│   ├── layout.tsx              # Split-screen layout (Hero illustration + Centered form)
│   ├── login/
│   │   └── page.tsx            # Login route (/login)
│   └── register/
│       └── page.tsx            # Role-categorized registration route (/register)
├── proxy.ts                    # Next.js 16 route proxy enforcing authentication cookies
└── context/
    └── AuthContext.tsx         # Global user session and authorization context
```

---

## 3. UI/UX Interface Specifications

### 3.1. Shared Authentication Shell (`(auth)/layout.tsx`)

- **Desktop Viewport:** 50/50 split-screen layout.
  - *Left Column:* Educational illustration highlighting scientific sex education, complemented by research citations.
  - *Right Column:* Centered, minimal authentication card with clean rounded aesthetics.
- **Mobile Viewport:** Clean single-column layout prioritizing form interaction and input ergonomics.

---

### 3.2. Registration Flow (`/register`)

#### Interface Elements:
1. **Headline & Value Proposition:** "Create Your Learning Account" with subtitle "Join a safe, scientifically grounded sex education community".
2. **Interactive Demographic Selector (Core UX Element):**
   - Replaces cumbersome select dropdowns with two prominent interactive selection cards:
     - **Card 1: "I am a Parent" (`STUDENT_PARENT`)**
       - Icon: Family / Guidance.
       - Caption: *Learn empathetic communication, active listening, and puberty support skills.*
     - **Card 2: "I am a Student / Teen" (`STUDENT_CHILD`)**
       - Icon: Student / Backpack.
       - Caption: *Explore bodily changes, emotional transitions, and digital self-defense instincts.*
   - Active state: Highlighted primary border with verification checkmark.
3. **Form Fields:**
   - Full Name (`full_name`)
   - Username (`username`)
   - Email Address (`email`)
   - Password (`password`) with visibility toggle (Show/Hide Password).
4. **Action CTA:** "Create Account" button (displays integrated loading spinner during API dispatch).
5. **Secondary Navigation:** "Already have an account? Sign In".

---

### 3.3. Sign-In Flow (`/login`)

#### Interface Elements:
1. **Headline:** "Welcome Back!".
2. **Input Fields:**
   - Username or Email.
   - Password.
3. **Session Controls:** "Remember Me" toggle.
4. **Action CTA:** "Sign In" button.
5. **Post-Authentication Redirection:**
   - `INSTRUCTOR` or `ADMIN` $\rightarrow$ Redirects to `/dashboard`.
   - `STUDENT_PARENT` or `STUDENT_CHILD` $\rightarrow$ Redirects to `/profile` or `/courses`.

---

## 4. UI Components & Tokens

| Component | Purpose / Usage |
| :--- | :--- |
| `Card`, `CardHeader`, `CardContent` | Form containers and elevation shells |
| `Input` | Text, email, and password input fields |
| `Button` | Action triggers with embedded `loading` and `disabled` states |
| `RadioGroup` / Custom Cards | Interactive demographic role selection cards |
| `ToastProvider` / `Toast` | Non-blocking feedback banners upon success or error |
| `Alert`, `AlertDescription` | Critical security alerts for locked or inactive accounts |

---

## 5. Client State Management & Route Protection

### 5.1. Session Token Lifecycle

Upon receiving a successful response from `POST /api/v1/auth/login`:
- Persist `access_token` in secure cookies or client-side storage.
- Populate `AuthContext` with user metadata (`id`, `full_name`, `role`).
- Attach `Authorization: Bearer <access_token>` headers to downstream API requests.
