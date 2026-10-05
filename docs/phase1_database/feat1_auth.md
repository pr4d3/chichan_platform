# Feature Specification 01: Authentication & Authorization (Database)

---

## 1. Scope & Technical Objectives

- Manage account identities, core credentials, and user lifecycle states.
- Support authentication operations (Registration, Login, Logout, Session Persistence).
- Provide Role-Based Access Control (RBAC) across four platform roles:
  1. `ADMIN` (System Administrator)
  2. `INSTRUCTOR` (Educator / Scientific Researcher)
  3. `STUDENT_PARENT` (Parent Learner)
  4. `STUDENT_CHILD` (Adolescent Learner)

---

## 2. Business Logic

### 2.1. Registration & Account Creation

- **Public Self-Service Registration:** Prospective learners can register freely and must select their target demographic role:
  - `STUDENT_PARENT` (Parent)
  - `STUDENT_CHILD` (Child / Adolescent)
- **Privileged Accounts (`INSTRUCTOR` & `ADMIN`):** Excluded from public registration; provisioned exclusively by existing `ADMIN` users via management interfaces.

### 2.2. Login & Session Lifecycle

- Authentication via Email or Username with one-way salted password hashing (bcrypt / passlib).
- User lifecycle status: `ACTIVE`, `INACTIVE`, `BANNED`.

### 2.3. Core RBAC Matrix

| Capability / Permission | ADMIN | INSTRUCTOR | STUDENT_PARENT | STUDENT_CHILD |
| :--- | :---: | :---: | :---: | :---: |
| User administration & Instructor privilege provisioning | Yes | No | No | No |
| Access parent-focused educational curricula | Yes | Yes | Yes | No |
| Access adolescent puberty & self-defense curricula | Yes | Yes | No | Yes |
| Access public/universal content | Yes | Yes | Yes | Yes |
| Author and manage courses and lessons | Yes | Yes | No | No |
| View Educator Analytics Dashboard | Yes | Yes | No | No |
| View personal profile and learning progress | Yes | Yes | Yes | Yes |
| Publish forum threads and post replies | Yes | Yes | Yes | Yes |
| **Moderate community forum (Hide/Delete threads & comments)** | **Yes** | **No** | **No** | **No** |

---

## 3. Database Schema Design

### 3.1. Table: `roles` (Role Taxonomy)

Defines system roles for flexible authorization management.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto Increment | Unique role identifier |
| `role_code` | String (Varchar 50) | Unique, Not Null | Unique code: `ADMIN`, `INSTRUCTOR`, `STUDENT_PARENT`, `STUDENT_CHILD` |
| `role_name` | String (Varchar 100) | Not Null | Display name (e.g., "Student - Parent") |
| `description` | Text | Nullable | Detailed privilege description |

---

### 3.2. Table: `users` (Core Account Identities)

Persists authentication credentials and identity profiles.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique user identifier |
| `role_id` | Integer | Foreign Key -> `roles(id)`, Not Null | Associated system role |
| `username` | String (Varchar 50) | Unique, Not Null | Account handle |
| `email` | String (Varchar 255) | Unique, Not Null | Primary contact and sign-in email |
| `password_hash` | String (Varchar 255) | Not Null | Cryptographic password hash |
| `full_name` | String (Varchar 150) | Not Null | Display name |
| `status` | String (Varchar 20) | Not Null, Default: `ACTIVE` | Account status: `ACTIVE`, `INACTIVE`, `BANNED` |
| `created_at` | Timestamp | Not Null, Default: Current Time | Registration timestamp |
| `updated_at` | Timestamp | Not Null, Default: Current Time | Last update timestamp |

---

### 3.3. Table: `user_sessions` (Active Session Management)

Tracks active login tokens and client metadata, facilitating token revocation and session invalidation.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique session identifier |
| `user_id` | BigInteger / UUID | Foreign Key -> `users(id)`, Not Null, Cascade Delete | User reference |
| `refresh_token` | Text | Unique, Not Null | Hashed refresh token or session identifier |
| `user_agent` | String (Varchar 255) | Nullable | Client device or browser user agent |
| `ip_address` | String (Varchar 45) | Nullable | Client IP address |
| `expires_at` | Timestamp | Not Null | Expiration timestamp |
| `created_at` | Timestamp | Not Null, Default: Current Time | Issuance timestamp |

---

## 4. Entity Relationships & Invariants

1. **`roles` → `users` (1 : N):** Each user is assigned exactly one primary system role.
2. **`users` → `user_sessions` (1 : N):** A user may hold multiple concurrent sessions across devices. Deleting a user cascades to invalidate all active sessions.
