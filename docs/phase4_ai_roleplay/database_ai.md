# Database Schema for AI Roleplay & RAG Service (Data Specs)

---

## 1. Scope & Technical Objectives

- Configure and persist the 4 interactive scenario simulation rooms (`ai_scenarios`).
- Manage real-time conversational sessions, rolling context summaries (`recent_summary`), and dynamic psychological/safety scores (`ai_sessions`).
- Record granular turn-by-turn message logs (spoken dialogue, physical action, emotion, score adjustments) for behavioral analysis (`ai_messages`).
- Implement an optimized **Vector Store (`pgvector`)** storing medical and safety domain chunks for retrieval-augmented generation (`ai_knowledge_vectors`).
- Provide an evaluation and session completion registry (`ai_game_evaluations`) for empirical research and scientific analysis.

---

## 2. Entity Relationship Overview

```text
[ai_scenarios] (4 Calibrated Simulation Scenarios)
      │
      │ (1 : N)
      ▼
[ai_sessions] (Simulation Session, Current Score, Rolling Summary)
      │
      ├── (1 : N) ──► [ai_messages] (Turn dialogue, action, emotion, score delta)
      │
      └── (1 : 1) ──► [ai_game_evaluations] (Final outcome, metrics, research summary)

[ai_knowledge_vectors] (Domain Knowledge Embeddings — pgvector)
```

---

## 3. Relational Schema Specifications

### 3.1. Table: `ai_scenarios` (Scenario Definitions)

Stores static configuration and persona boundaries for the 4 roleplay simulation rooms.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto Increment | Unique scenario identifier |
| `room_code` | String (Varchar 50) | Unique, Not Null | Scenario code: `ROOM_STRANGER`, `ROOM_DOCTOR`, `ROOM_TEEN_CHILD`, `ROOM_BULLYING` |
| `title` | String (Varchar 255) | Not Null | User-facing room title |
| `npc_name` | String (Varchar 100) | Not Null | Character name (e.g., "Quan Kool", "Dr. Minh Trang") |
| `npc_avatar_url` | String (Varchar 500) | Nullable | Scenario character portrait URI |
| `initial_score` | Integer | Not Null, Default: 50 | Baseline safety or trust score (0–100) |
| `target_audience` | String (Varchar 20) | Not Null | Target audience: `CHILD`, `PARENT`, or `BOTH` |
| `is_active` | Boolean | Not Null, Default: true | Availability toggle |

---

### 3.2. Table: `ai_sessions` (Active Sessions & Memory Buffers)

Tracks active simulation progress, dynamic scores, and rolling conversational memory.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique session identifier |
| `user_id` | BigInteger / UUID | Not Null | Foreign key referencing `users.id` |
| `scenario_id` | Integer | Foreign Key -> `ai_scenarios(id)`, Not Null | Associated simulation scenario |
| `current_score` | Integer | Not Null | Dynamic evaluation score (0–100) |
| `current_emotion` | String (Varchar 30) | Not Null, Default: `neutral` | Active NPC emotional state |
| `recent_summary` | Text | Nullable | Asynchronously updated rolling summary for dynamic context injection |
| `status` | String (Varchar 20) | Not Null, Default: `ACTIVE` | Session lifecycle: `ACTIVE`, `WON`, `LOST`, `ABANDONED` |
| `created_at` | Timestamp | Not Null, Default: Current Time | Session initialization timestamp |
| `updated_at` | Timestamp | Not Null, Default: Current Time | Last turn timestamp |

---

### 3.3. Table: `ai_messages` (Message Logs & Interaction Telemetry)

Detailed transcript of dialogue turns, actions, emotions, and delta scores.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique message identifier |
| `session_id` | BigInteger / UUID | Foreign Key -> `ai_sessions(id)`, Not Null, Cascade Delete | Parent session identifier |
| `sender` | String (Varchar 10) | Not Null | Message originator: `USER` or `NPC` |
| `dialogue` | Text | Not Null | Spoken dialogue content |
| `action` | String (Varchar 255) | Nullable | Narrative physical action cues (e.g. enclosed in asterisks) |
| `emotion` | String (Varchar 30) | Nullable | NPC emotion expressed at this turn |
| `score_change` | Integer | Not Null, Default: 0 | Score delta applied (+/-) |
| `created_at` | Timestamp | Not Null, Default: Current Time | Dispatch timestamp |

---

### 3.4. Table: `ai_knowledge_vectors` (Medical & Safety Knowledge Base — pgvector)

Vectorized factual domain chunks queried by the RAG retrieval engine.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique chunk identifier |
| `category` | String (Varchar 50) | Not Null | Domain topic: `ONLINE_SAFETY`, `PUBERTY_ANATOMY`, `COMMUNICATION_SKILLS` |
| `topic` | String (Varchar 150) | Not Null | Content headline (e.g., "5-Finger Rule", "Nocturnal Emissions") |
| `content_chunk` | Text | Not Null | Medically verified educational text |
| `embedding` | Vector(768) | Not Null | Dense embedding vectors (`text-embedding-004` or compatible) |
| `created_at` | Timestamp | Not Null, Default: Current Time | Ingestion timestamp |

---

### 3.5. Table: `ai_game_evaluations` (Scientific Evaluation & Analytics Registry)

Quantitative evaluation metrics synthesized upon scenario completion.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique evaluation identifier |
| `session_id` | BigInteger / UUID | Unique, Foreign Key -> `ai_sessions(id)`, Not Null | Reference to completed session |
| `user_id` | BigInteger / UUID | Not Null | Learner identifier |
| `scenario_id` | Integer | Not Null | Scenario identifier |
| `final_score` | Integer | Not Null | Final score achieved (0–100) |
| `result_outcome` | String (Varchar 50) | Not Null | Outcome enum: `SAFE_EXIT`, `DANGER_ALERT`, `OPEN_HEART`, `CLOSE_HEART` |
| `total_turns` | Integer | Not Null | Total message turns elapsed |
| `duration_seconds` | Integer | Not Null | Elapsed duration in seconds |
| `ai_feedback_summary` | Text | Nullable | Automated pedagogical feedback explaining player behavioral instincts |
| `created_at` | Timestamp | Not Null, Default: Current Time | Completion timestamp |

---

## 4. Indexing & Optimization Strategy

### 4.1. Vector Indexing (Sub-15ms Semantic Retrieval)

- **Index Algorithm:** **HNSW (Hierarchical Navigable Small World)** on `ai_knowledge_vectors(embedding)`:
  - Distance metric: `vector_cosine_ops` (Cosine Distance).
  - Hyperparameters: `m = 16`, `ef_construction = 64`.
  - **Objective:** Sub-15ms top-K retrieval under high concurrent request volume.

### 4.2. Relational Indexes (Context & Session Lookups)

- `idx_ai_messages_session_created`: Composite B-Tree index on `(session_id, created_at DESC)` in `ai_messages` for instant retrieval of sliding window turns.
- `idx_ai_sessions_user_status`: Composite index on `(user_id, status)` in `ai_sessions`.
- `idx_ai_evaluations_scenario`: Index on `(scenario_id, result_outcome)` for research analytics queries.

---

## 5. Analytical Views for Scientific Research

To support empirical evaluation without complex manual querying:

### 5.1. View: `view_research_scenario_metrics`
Aggregates cohort performance per scenario:
- Total sessions completed per room.
- Safe resolution rate (`WIN_RATE` = count of `SAFE_EXIT` + `OPEN_HEART` / total completions * 100).
- Mean final score (`AVG_FINAL_SCORE`).
- Mean conversational turns to resolution (`AVG_TURNS`).

### 5.2. View: `view_research_user_growth`
Measures pedagogical efficacy by comparing a learner's baseline score on their initial run against subsequent attempts.

---

## 6. Security & Infrastructure Principles

1. **Unified Database Architecture:** Both Web Backend and AI Roleplay Service share a single Supabase PostgreSQL instance via the **Transaction Pooler (Port 6543)**, avoiding dual-database synchronization complexity.
2. **Storage Discipline:** Media assets (avatars, thumbnails, certificates) are strictly hosted in Supabase Storage Buckets; the database holds only sanitized URIs.
3. **Graceful Data Archival:** When table size approaches capacity limits, a scheduled exporter serializes completed `ai_messages` records into compressed CSV/JSON files in object storage, safeguarding scientific research data.
