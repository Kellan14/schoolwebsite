# StudyCards

A flashcard study app built with Next.js, Supabase, and Tailwind CSS. Create subjects, add flashcards, study with spaced repetition (SM-2), and test yourself with quizzes.

**Live:** [kellanschoolsite.vercel.app](https://kellanschoolsite.vercel.app)

## Features

- **Subjects** - Organize flashcards into classes/subjects with custom colors
- **Flashcard study** - Flip cards with keyboard shortcuts (Space to flip, 1-4 to rate)
- **SM-2 spaced repetition** - Cards are scheduled based on how well you know them
- **Quiz mode** - Multiple choice, typed answer, or true/false quizzes with score tracking
- **Progress tracking** - Charts showing quiz scores over time and per-subject performance
- **Public/private sets** - Share subjects publicly for others to study or quiz
- **Flag for review** - Users can flag inappropriate public content
- **Dark mode** - Toggle between light and dark themes

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS v4, shadcn/ui (Base UI)
- **Database:** Supabase (PostgreSQL + Row Level Security)
- **Auth:** Supabase Auth (email/password)
- **Hosting:** Vercel
- **Charts:** Recharts v3

## Project Structure

```
app/
  layout.tsx              # Root layout with providers + nav bar
  page.tsx                # Dashboard (home)
  login/page.tsx          # Login page
  register/page.tsx       # Registration page
  browse/page.tsx         # Browse public flashcard sets
  subjects/page.tsx       # Subject list
  subjects/[subjectId]/
    page.tsx              # Subject detail (card list, CRUD)
    study/page.tsx        # Study session with flashcards
    quiz/page.tsx         # Quiz mode
  progress/page.tsx       # Progress charts
  auth/callback/route.ts  # Supabase auth callback
  api/
    subjects/             # CRUD + public listing
    subjects/[subjectId]/ # Update, delete subjects
    subjects/[subjectId]/flag/  # Flag subject for review
    cards/                # CRUD cards (single + bulk)
    cards/[cardId]/       # Update, delete individual cards
    progress/             # GET progress stats
    progress/review/      # POST SM-2 review
    quiz/start/           # POST start quiz session
    quiz/submit/          # POST submit quiz results

components/
  flashcard.tsx           # 3D CSS flip card
  nav-bar.tsx             # Top navigation with auth state
  providers.tsx           # Theme provider wrapper
  dashboard-page.tsx      # Home page with stats + subject grid
  subjects-page.tsx       # Subject grid with create/delete/public toggle
  subject-detail-page.tsx # Card list with CRUD + bulk import
  study-page.tsx          # Spaced repetition study session
  quiz-page.tsx           # Quiz with 3 modes + results
  browse-page.tsx         # Browse/study/quiz public sets
  progress-page.tsx       # Charts (quiz scores, per-subject averages)
  login-page.tsx          # Login form
  register-page.tsx       # Registration form
  ui/                     # shadcn/ui components

lib/
  api.ts                  # Authenticated fetch helper
  sm2.ts                  # SM-2 spaced repetition algorithm
  supabase.ts             # Browser Supabase client
  supabase-server.ts      # Server-side Supabase client for API routes
  utils.ts                # cn() utility

hooks/
  use-auth.ts             # Auth hook (user state, sign out)

supabase/
  schema.sql              # Initial database schema (subjects, cards, user_progress, quiz_results)
  migration-public-flag.sql  # Adds is_public + flagged columns, public read policies

scripts/
  build.sh                # Custom build script for Vercel compatibility
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `subjects` | Classes/subjects with name, color, public/private, flagged |
| `cards` | Flashcards with front/back text, linked to a subject |
| `user_progress` | SM-2 state per card per user (ease factor, interval, next review) |
| `quiz_results` | Quiz score history (mode, score, duration) |

All tables use Row Level Security. Users can only access their own data. Public subjects and their cards are readable by anyone.

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project
- A Vercel account (for deployment)

### Local Development

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/Kellan14/schoolwebsite.git
   cd schoolwebsite
   npm install
   ```

2. Create `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. Run the SQL files in Supabase SQL Editor:
   - `supabase/schema.sql` (initial schema)
   - `supabase/migration-public-flag.sql` (public/private feature)

4. Start the dev server:
   ```bash
   npm run dev
   ```

### Vercel Deployment

1. Push to GitHub
2. Import in Vercel, add the same env vars (with production `NEXT_PUBLIC_SITE_URL`)
3. The custom `scripts/build.sh` handles Next.js 16 compatibility with Vercel

## Keyboard Shortcuts

| Context | Key | Action |
|---------|-----|--------|
| Study | Space | Flip card |
| Study | 1 | Rate: unknown |
| Study | 2 | Rate: hard |
| Study | 3 | Rate: good |
| Study | 4 | Rate: known |
