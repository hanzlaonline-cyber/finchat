# Project Structure

All application code lives under `finchat/src/`.

```
finchat/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (wraps AuthProvider)
│   │   ├── page.tsx                # Root redirect (→ /dashboard or /login)
│   │   ├── globals.css             # Global styles
│   │   ├── api/                    # Server-side API routes
│   │   │   ├── chat/route.ts       # AI chat (Groq)
│   │   │   ├── ai-parse/route.ts   # NL → structured transaction
│   │   │   ├── categorize/route.ts # Auto-categorization
│   │   │   └── insights/route.ts   # Financial insights generation
│   │   ├── dashboard/page.tsx
│   │   ├── expenses/page.tsx
│   │   ├── income/page.tsx
│   │   ├── budgets/page.tsx
│   │   ├── goals/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── verify-email/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                     # Base UI primitives (shadcn-style, Radix-backed)
│   │   ├── layout/                 # AppLayout, Sidebar, TopBar, ProfileMenu
│   │   ├── dashboard/              # KPICard, HealthScore
│   │   ├── charts/                 # Recharts wrappers (line, donut, trend)
│   │   ├── transactions/           # TransactionList, TransactionForm
│   │   └── ai/                     # AIInputField (NL transaction entry)
│   │
│   ├── store/                      # Zustand stores
│   │   ├── authStore.ts            # Firebase user + userProfile + loading
│   │   ├── transactionStore.ts     # Real-time Firestore listener
│   │   ├── filterStore.ts          # Global date filter
│   │   └── uiStore.ts              # UI state
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx         # Bridges Firebase onAuthStateChanged → stores
│   │
│   ├── lib/
│   │   ├── firebase.ts             # Firebase app/auth/db init
│   │   ├── firestore.ts            # All Firestore CRUD functions
│   │   └── utils.ts                # cn(), formatCurrency(), date helpers, category/color constants
│   │
│   ├── hooks/
│   │   └── useCurrency.ts          # Per-user currency formatting hook
│   │
│   └── types/
│       └── index.ts                # Shared TypeScript interfaces
│
├── public/                         # Static assets
├── .env.local                      # Environment variables (never commit)
├── next.config.ts
├── package.json
└── firestore.rules                 # Firestore security rules
```

## Key Conventions

- **Page files** are `page.tsx` inside named route folders; all are `'use client'` components.
- **API routes** export named HTTP handlers (`POST`, `GET`) from `route.ts` files.
- **All pages** wrap content in `<AppLayout>` which provides the sidebar + topbar shell.
- **Auth guard** pattern: pages check `useAuthStore()` and redirect to `/login` if unauthenticated.
- **Firestore access** is centralized in `src/lib/firestore.ts` — do not call Firestore directly from components or pages.
- **Types** are centralized in `src/types/index.ts` — add new shared interfaces there.
- **Constants** (category lists, colors, payment methods) live in `src/lib/utils.ts`.
- **`@/`** path alias maps to `src/` — always use it for imports.
- New UI primitives go in `src/components/ui/`; feature components go in their domain subfolder.
