# Feature Specification 06: General Pages & CMS Settings (Frontend UI/UX)

---

## 1. Scope & Technical Objectives

- Deliver public-facing pages welcoming learners with a warm, scientific, and stigma-free design language:
  1. **Home Page (`/`):** Communicates the platform mission, provides demographic tabs separating parent and adolescent curricula, showcases the AI roleplay simulator, and highlights community discussions.
  2. **About Us (`/about`):** Details the scientific research origin at Giong Ong To High School, pedagogical framework, advisory board disclosures, and academic feedback channels.

---

## 2. Next.js Routing Architecture

```text
frontend/src/app/
└── (public)/
    ├── page.tsx                        # Home Page (/)
    ├── about/
    │   └── page.tsx                    # Scientific Research Overview (/about)
    ├── _components/
    │   ├── Header.tsx                  # Public Navigation Shell
    │   └── Footer.tsx                  # Footer & Institutional Disclosures
    └── _home/
        ├── HeroTypingTitle.tsx         # Animated Hero Title
        ├── HeroVisualShowcase.tsx      # Interactive Hero Visual Canvas
        ├── ThreeStepJourney.tsx        # 3-Step Educational Philosophy
        └── FeaturedRoleplaySection.tsx # AI Simulation Room Showcase
```

---

## 3. UI/UX Interface Specifications

### 3.1. Home Page (`/`)

#### A. Hero Banner:
- **Visual Design:** Warm, welcoming palette (Pastel Indigo, Coral Peach) depicting supportive family connections and adolescent growth.
- **Primary Headline (H1):** *"Scientific Sex Education & Digital Safety Platform"*.
- **Subtitle:** Medically grounded, stigma-free learning designed to empower Vietnamese youth and foster open parent-child conversations.
- **Call-to-Action Triggers:**
  - Primary CTA: **"Explore Courses"** $\rightarrow$ Scrolls to course catalog section.
  - Secondary CTA: **"Learn About Our Research"** $\rightarrow$ Navigates to `/about`.

#### B. Three Core Educational Pillars:
1. **Medically Verified Science:** Curricula reviewed by adolescent healthcare specialists.
2. **Empathetic & Accessible:** Non-judgmental language and visual storytelling tailored to developmental stages.
3. **Safe & Moderated Discourse:** Anonymous community forum and AI roleplay rooms for risk-free experiential learning.

#### C. Audience-Targeted Course Tabs:
Tabs allowing learners to toggle between audience segments:
- **Tab 1: "For Parents"**
  - Features 3–4 parent-focused courses (e.g., *"Guiding Adolescents Through Puberty", "Active Listening Strategies"*).
- **Tab 2: "For Teens & Students"**
  - Features 3–4 youth-focused courses (e.g., *"Understanding Body Transitions", "Online Safety & Boundary Defense"*).
- **Catalog Navigation:** "View All Courses →" anchor linking to `/courses`.

#### D. Community Forum Highlights:
- Displays top 3 recent discussions from the moderated forum.
- Anchor button: **"Join Community Forum"** linking to `/forum`.

---

### 3.2. About Us Page (`/about`)

#### A. Academic Research Background:
- **Initiative Headline:** *"Scientific Research Initiative: Digital Sex Education & Self-Defense Platform for Vietnamese Adolescents"*.
- **Institutional Context:** Originating at Giong Ong To High School, addressing communication barriers and promoting evidence-based sex education.

#### B. Information Cards:
1. **Research Objectives:** Developing technological solutions to enhance adolescent self-defense, mitigate cyber exploitation risks, and bridge generational communication divides.
2. **Pedagogical Methodology:** Age-stratified modular curricula coupled with interactive AI roleplay simulation training.
3. **Research Team & Advisors:**
   - Author profile cards: Portrait, name, institutional affiliation, project role.
   - Medical advisors and academic consultation panel disclosures.

#### C. Academic Feedback Channel:
- Dedicated institutional contact module allowing educators, researchers, and healthcare professionals to submit feedback on pedagogical content.

---

## 4. UI Components & Tokens

| Component | Purpose / Usage |
| :--- | :--- |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Demographic course filtering tabs on the landing page |
| `Card`, `CardHeader`, `CardTitle`, `CardContent` | Course preview cards, core pillar tiles, and research credits |
| `Badge` | Target audience tags (`PARENT` / `CHILD`) |
| `Avatar`, `AvatarImage`, `AvatarFallback` | Portraits for authors and advisory board members |
| `Button` | High-visibility CTA anchors and navigation controls |
