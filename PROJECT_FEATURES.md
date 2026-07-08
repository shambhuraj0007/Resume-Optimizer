# ShortlistAI - Project Features & Technical Documentation

This document provides a detailed breakdown of the features, technical architecture, and key implementation details of **ShortlistAI**. It is designed to serve as a reference for interviews and technical discussions, highlighting the complexity and value of the solution.

## 1. Core Product Features

### 🎯 ATS Resume Checker (Job Match Analysis)
The core entry point for users. It analyzes a specific resume against a target job description (JD).
*   **Deep Matching Analysis**: Unlike simple keyword counters, this system uses a multi-layered analysis:
    *   **Exact Match**: 100% score contribution.
    *   **Semantic Match**: Handles synonyms (e.g., "React.js" = "React") and related terms.
    *   **Location Boosting**: Skills found in high-priority areas (Work Experience, Job Titles) are weighted higher than those in generic lists.
*   **Gap Analysis**:
    *   Identifies **Critical Missing Skills** (High Importance).
    *   Flags **Insufficient Experience** (Years of experience check).
    *   Detects **Formatting Issues** (Parseability, contact info, standard sections).
*   **Scoring Breakdown**: Provides granular scores for:
    *   Skills (35%)
    *   Experience (20%)
    *   Education (15%)
    *   Responsibilities (15%)
    *   Job Titles (10%)
    *   Formatting (5%)
*   **Interactive Onboarding**: A guided tour (`driver.js`) walks new users through the analysis reports, ensuring they understand "Match Score" vs "Interview Probability".

### 🚀 AI Resume Optimizer
The "Fix It" solution that acts on the ATS analysis.
*   **Automated Rewriting**: Uses AI to rewrite the Professional Summary and Experience bullet points, naturally integrating missing keywords identified in the analysis phase.
*   **Professional Templates**:
    *   **React-based Templates**: Modern, Minimal, Professional, and Creative layouts rendered dynamically.
    *   **LaTeX Support**: Generates downloadable `.tex` files for academic/research roles.
*   **Live Preview & Editing**:
    *   Real-time reflection of changes (Fonts, Accent Colors, Section Ordering).
    *   **Drag-and-Drop Reordering**: Users can rearrange resume sections (e.g., move Education above Experience).
    *   **Inline Editing**: Click-to-edit any text field directly in the preview.
*   **PDF Generation**: High-fidelity PDF export that matches the screen preview pixel-perfectly.
*   **Smart Parsing**: Automatically parses uploaded PDFs to populate the editable data structure (Work Experience, Education, Skills).

### 💳 Credit & Monetization System
*   **Action-Based Currency**: Users consume credits for high-value actions (Deep Analysis, Resume Generation).
*   **State Management**: Real-time credit balance tracking stored in MongoDB and synced via NextAuth session.
*   **Upsell Mechanics**: integrated "Insufficient Credits" modals and upgrade paths.

---

## 2. Technical Architecture (Interview Gold)

### 🏗️ Tech Stack
*   **Framework**: **Next.js 14** (App Router) for server-side rendering and API routes.
*   **Language**: **TypeScript** for strict type safety and maintainability.
*   **Styling**: **Tailwind CSS** + **Shadcn UI** for a modern, responsive, and accessible design system.
*   **Database**: **MongoDB** (via Mongoose) for flexible user data and resume storage.
*   **Auth**: **NextAuth.js v4** with custom callbacks to persist onboarding state and credits.
*   **State Management**: React `Context` (AnalysisContext) + `SessionStorage` for persistence across reloads.
*   **Storage**: **IndexedDB** for handling large temporary file blobs (PDFs) on the client side without overloading the server.

### 🧠 The Scoring Engine (`lib/scoring/scoreEngine.ts`)
*   **Deterministic Algorithm**: Unlike "black box" AI scores, this uses a transparent, weighted heuristic algorithm.
*   **Weighted Importance**:
    *   Top 10 required skills get a **1.5x multiplier**.
    *   Critical "Must Have" skills can cap the maximum potential score if missing.
*   **Simulation Logic**: The system calculates a **Potential Score** by simulating "what if the user accepts all AI suggestions?", showing the tangible value of optimization.
*   **Callback Probability Curve**: Converts the raw 0-100 score into a realistic "Interview Probability" using a non-linear curve (e.g., going from 50 to 60 gives a bigger probability jump than 80 to 90).

### 🔄 Data Flow & State Management
1.  **Analyze**: User upload -> API (Parse & Analyze) -> `AnalysisContext`.
2.  **Persist**: Results saved to `SessionStorage` to survive page refreshes.
3.  **Optimize**: `resume-optimizer` reads Analysis data -> Generating AI suggestions -> Updates `ResumeData` state.
4.  **Render**: `ResumeRenderer` component takes `ResumeData` + `TemplateID` -> Renders React components.
5.  **Export**: `puppeteer` (or similar endpoint) captures the rendered React component as PDF.

---

## 3. Key Differentiators to Highlight

*   **"Glass Box" Scoring**: We clarify *why* a score is low (e.g., "Missing 'React' in Work Experience").
*   **Full Cycle Solution**: We don't just find problems (Checker) we fix them (Optimizer).
*   **UX Focus**:
    *   **Animated Loaders**: Psychological "trust building" loaders that show the AI "thinking" (Parsing -> Analyzing -> Matching).
    *   **Onboarding Tours**: Custom implementation using `driver.js` to reduce user friction and confusion.
    *   **Accessibility**: Reduced motion support in animations.

## 4. Specific Implementation Details (Code Walkthrough Notes)

*   **Onboarding Persistence**:
    *   **Problem**: Tours showing every time.
    *   **Solution**: Added `hasCompletedAtsOnboarding` and `hasCompletedOptimizedResumeOnboarding` boolean flags to the User schema.
    *   **Sync**: These flags are fetched in `authOptions.ts` session callback to ensure the client always has the SSOT (Single Source of Truth) from the database.
    *   **Instant Update**: Using `update()` from `useSession` immediately after the API call to refresh the UI without a page reload.

*   **Resume Loader (`ResumeOptimizationLoader.tsx`)**:
    *   Uses `useMemo` for stable configuration.
    *   Accepts `isOptimizationComplete` prop to short-circuit the animation if the backend is faster than the animation loop, ensuring a snappy feel.

*   **Role-Based Templates**:
    *   The system doesn't just use one layout. "Creative" uses different spacing/colors than "Professional".
    *   This is handled via a **Strategy Pattern** where the `ResumeRenderer` dynamically selects the component based on the `templateId`.
