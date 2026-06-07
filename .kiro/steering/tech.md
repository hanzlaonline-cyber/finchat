# Tech Stack

## Framework & Runtime
- **Next.js 16** (App Router) — pages use the `app/` directory convention
- **React 19** with TypeScript 5
- **Node.js** (via Next.js server runtime)

> ⚠️ This project uses Next.js 16 which may differ from training data. Before writing any Next.js-specific code, consult `node_modules/next/dist/docs/` for current API conventions.

## Styling
- **Tailwind CSS v4** with `@tailwindcss/postcss`
- `tailwind-merge` + `clsx` via a `cn()` utility in `src/lib/utils.ts`
- `tailwindcss-animate` for animations
- Glass-morphism UI pattern: `bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl`

## UI Components
- **Radix UI** primitives (dialog, select, tabs, switch, tooltip, popover, dropdown, avatar, etc.)
- Custom shadcn-style wrappers in `src/components/ui/`
- **Lucide React** for icons
- **Recharts** for charts (line, donut/pie)

## State Management
- **Zustand v5** — stores in `src/store/`
  - `authStore` — Firebase user + app user profile + loading state
  - `transactionStore` — real-time Firestore listener, scoped to signed-in user
  - `filterStore` — global date filter state
  - `uiStore` — UI-level state

## Backend / Database
- **Firebase v12**
  - **Firebase Auth** — email/password + Google OAuth; email verification required before data access
  - **Firestore** — collections: `users`, `transactions`, `budgets`, `goals`, `notifications`
  - All Firestore access in `src/lib/firestore.ts`; Firebase init in `src/lib/firebase.ts`
- Firestore queries use single-field `where` clauses to avoid composite index requirements; sorting is done client-side

## AI / LLM
- **Groq SDK** (`groq-sdk`) — model: `llama-3.3-70b-versatile`
- API routes: `/api/chat`, `/api/ai-parse`, `/api/categorize`, `/api/insights`
- API key via `GROQ_API_KEY` environment variable (server-side only)

## Date Utilities
- **date-fns v4** for date manipulation
- Transaction dates stored as `YYYY-MM-DD` strings (lexicographic sort = chronological)

## PDF Export
- **jsPDF** for client-side PDF generation (reports)

## Environment Variables
Stored in `finchat/.env.local`:
- `NEXT_PUBLIC_FIREBASE_*` — Firebase config (client-safe)
- `GROQ_API_KEY` — Groq API key (server-only, never expose to client)

## Common Commands

```bash
# Development server (run manually in terminal)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

All commands run from the `finchat/` directory.
