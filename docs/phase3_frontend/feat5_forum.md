# Feature Specification 05: Forum & Community (Frontend UI/UX)

---

## 1. Scope & Technical Objectives

- Deliver a safe, civil, and open community forum interface for discussions on sex education, reproductive health, and digital safety.
- User capabilities:
  - Browse discussions by thematic categories and perform keyword searches.
  - Publish new inquiry threads.
  - Submit comments and engage in nested reply conversations.
- **Exclusive Administrative Moderation Interface:**
  - Action triggers to **Hide (`HIDDEN`)** or **Delete (`DELETED`)** content are rendered **strictly for accounts with the `ADMIN` role**.
  - Standard learners and educators have zero exposure to moderation controls.

---

## 2. Next.js Routing Architecture

```text
frontend/src/app/
└── (public)/
    └── forum/
        ├── page.tsx                        # Forum Feed & Categorized Listing (/forum)
        └── [postId]/
            └── page.tsx                    # Detailed Thread & Comment Tree (/forum/[postId])
```

---

## 3. UI/UX Interface Specifications

### 3.1. Forum Feed Listing (`/forum`)

#### A. Header & Search Controls:
- **Title:** "Community Forum & Sex Education Q&A".
- **Search Bar:** Real-time debounced keyword search input.
- **Primary CTA:** "+ Ask Question / Start Discussion" (Requires authentication $\rightarrow$ Triggers `CreatePostModal`).
- **Category Filter Chips:**
  - Rounded pills: `All` | `Reproductive Health` | `Puberty Psychology` | `Safety & Boundary Defense` | `Parent Corner`.

#### B. Thread Feed Cards:
Each discussion card displays:
- **Author Identity:** Avatar + Name + Demographic Badge (`Parent`, `Student`, `Instructor`, `Admin`) + Relative Timestamp (e.g., *2 hours ago*).
- **Category Tag:** Compact thematic badge (e.g., *Puberty Psychology*).
- **Title:** Semibold typography linking to the full thread.
- **Excerpt:** Two-line truncated synopsis.
- **Card Footer:** Comment counter with icon (e.g., `8 replies`).
- **Admin Moderation Trigger (ADMIN Only):** Contextual three-dot dropdown containing *Hide Thread* and *Delete Thread* actions.

---

### 3.2. Detailed Thread & Nested Discussions (`/forum/[postId]`)

#### A. Primary Thread Section:
- "← Back to Forum" return anchor.
- Full post headline and categorized metadata.
- Author profile information.
- Complete thread body.
- Administrative moderation triggers (Hide/Delete) if caller holds `ADMIN` privileges.

#### B. Comment Submission Box:
- Authenticated view: Multi-line textarea with "Submit Comment" button.
- Unauthenticated view: Banner prompting *"Sign in to join the conversation"* linking to the sign-in route.

#### C. Nested Comment Tree:
- **Top-Level Comments:**
  - Avatar, author name, demographic role badge, and timestamp.
  - Comment text.
  - "Reply" trigger toggling inline reply input.
  - Admin moderation actions (Hide/Delete).
- **Nested Replies (Indented Conversation):**
  - Indented visual hierarchy (`pl-6 border-l-2`) visually grouping replies beneath their parent comment.

---

### 3.3. Administrative Moderation Modal

- Clicking "Hide Thread" or "Delete Comment" displays a confirmation modal:
  - *Title:* "Confirm Content Moderation"
  - *Message:* "Are you sure you want to remove this content from the public community forum?"
  - *Actions:* "Cancel" and a destructive "Confirm Moderation" button.
- Confirmation triggers the moderation API, removes the item from the active feed, and displays a feedback toast notification.

---

## 4. UI Components & Tokens

| Component | Purpose / Usage |
| :--- | :--- |
| `Card`, `CardContent` | Feed discussion cards and comment blocks |
| `Input` | Forum search input |
| `Textarea` | Post creation and comment submission forms |
| `Badge` | Category tags and user demographic badges |
| `DropdownMenu` | Administrative moderation action menus |
| `AlertDialog` | Destructive action confirmation dialogs |
