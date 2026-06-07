# FinChat — Kiro Build Log

**Project:** FinChat — AI-Powered Personal Finance SaaS  
**Stack:** Next.js 16 · TypeScript · Firebase · Groq AI · Tailwind CSS v4  
**Built by:** Kiro AI  
**Location:** `C:\Users\Hanzla Bin Imran\Desktop\FinChat\finchat`

---

## Session 1 — Full Application Scaffold

### What was built
Complete production-ready SaaS application from scratch.

**Project setup**
- Scaffolded Next.js 16.2.7 with App Router, TypeScript, Tailwind CSS v4
- Installed all dependencies: Firebase, Groq SDK, Recharts, Zustand, Radix UI, date-fns, jsPDF, lucide-react

**Core configuration**
| File | Purpose |
|------|---------|
| `.env.local` | Firebase + Groq API keys |
| `next.config.ts` | Image domains for Google profile photos |
| `src/lib/firebase.ts` | Firebase app initialization |
| `src/lib/firestore.ts` | All Firestore CRUD operations |
| `src/lib/utils.ts` | `formatCurrency`, `formatDate`, date range helpers, category constants |
| `src/types/index.ts` | All TypeScript interfaces |
| `src/store/authStore.ts` | Zustand auth state |
| `src/store/filterStore.ts` | Global date filter state |
| `src/contexts/AuthContext.tsx` | Firebase auth listener, profile loader |

**UI component library** (`src/components/ui/`)
- `button.tsx` — gradient pill buttons with variants
- `card.tsx` — glassmorphism card
- `input.tsx`, `label.tsx`, `textarea.tsx`
- `select.tsx`, `dialog.tsx`, `tabs.tsx`
- `badge.tsx`, `progress.tsx`, `switch.tsx`

**Layout components** (`src/components/layout/`)
- `Sidebar.tsx` — fixed left navigation
- `TopBar.tsx` — sticky header with date filter
- `AppLayout.tsx` — wrapper combining sidebar + topbar

**Dashboard components**
- `KPICard.tsx` — metric cards with trend indicators
- `HealthScore.tsx` — circular SVG progress gauge
- `SpendingTrendChart.tsx` — Recharts Area chart
- `CategoryDonutChart.tsx` — Recharts Pie/Donut chart
- `SpendingLineChart.tsx` — Recharts Line chart
- `TransactionList.tsx` — transaction rows with actions
- `TransactionForm.tsx` — add/edit form with AI categorization

**API routes**
- `/api/chat` — Groq LLM chat with financial context injection
- `/api/categorize` — AI auto-categorization for manual entry
- `/api/insights` — generates 3-4 financial insights from transaction data

**Pages built**
- `/` — Landing page (glassmorphism SaaS design)
- `/login` — Email/password + Google auth
- `/signup` — Account creation with sample data seeding
- `/dashboard` — KPIs, charts, recent transactions, AI insights
- `/expenses` — Full CRUD, search, filter, pagination
- `/income` — Income tracking with trend chart
- `/budgets` — Monthly category budgets with progress tracking
- `/goals` — Savings goals with deadline tracking
- `/reports` — Analytics + PDF/CSV export
- `/chat` — Groq AI assistant with financial context
- `/notifications` — Read/unread notification system
- `/settings` — Profile, password, currency, data export, account deletion

**Firebase**
- `firestore.rules` — user-scoped security rules
- Seed data function: 12 transactions, 6 budgets, 3 goals per new user
- All queries filtered by `userId`

**Build result:** 18 routes compiled successfully, zero TypeScript errors

---

## Session 2 — AI Smart Input System + UI Upgrades

### Changes made

**New store**
- `src/store/uiStore.ts` — sidebar collapse state (persisted to localStorage)

**Sidebar upgrade**
- Collapsible toggle button (ChevronLeft/ChevronRight)
- Collapsed: icon-only mode (68px width)
- Expanded: full labels (256px)
- Smooth CSS transition (`transition-all duration-300`)
- Tooltips on collapsed state via CSS hover

**TopBar upgrade**
- Added `onAddIncome` / `onAddExpense` callback props
- Custom date range picker with Start/End date inputs
- Date filter options: Today, Last 7 days, Last 30 days, This Month, Custom Range
- Pill-style action buttons for Income/Expense visible in header
- Dropdown closes on outside click (useRef + mousedown listener)

**AppLayout**
- Width adjusts dynamically with sidebar: `ml-[68px]` or `ml-64`
- Passes `onAddIncome` / `onAddExpense` through to TopBar

**New API route**
- `/api/ai-parse` — single-transaction NLP parser
  - Groq structured prompting with `response_format: json_object`
  - Split bill detection (participants, perPersonAmount)
  - Validates all fields, strips undefined for Firestore
  - Returns 422 with specific error on parse failure

**New component**
- `src/components/ai/AIInputField.tsx`
  - Natural language input field
  - Parse → Preview → Confirm pipeline
  - Shows category color, confidence score, split bill badge
  - "AI Suggest" categorization button in TransactionForm

**Dashboard updates**
- AI input field added above KPI cards
- Add Income / Add Expense dialogs wired to TopBar buttons
- Today's Spend KPI added

**Expenses/Income pages**
- Manual Entry / AI Entry tabs using Radix Tabs

---

## Session 3 — Action Bar Visibility + Firebase Index Fix

### Changes made

**TopBar redesign**
- Two-row layout: title row + action pill row
- `ActionPill` component: pill-style with emerald/rose color variants
- Buttons always visible, not hidden on mobile
- Date range selector redesigned as rounded-full pill button

**Firebase Firestore fixes**
- Removed `orderBy` from `getTransactions` query (caused composite index error)
- Removed `orderBy` from `getNotifications` query
- Removed `orderBy` from `getRecentTransactions`
- All sorting now done client-side after `getDocs`
- Removed unused `orderBy` import

**Dialog accessibility**
- Added `aria-describedby={undefined}` to DialogContent to suppress Radix warning

---

## Session 4 — Profile Menu with Avatar

### New files
- `src/components/layout/ProfileMenu.tsx`

### What was built

**`Avatar` component**
- Shows Firebase Auth `photoURL` (Google profile picture) via `next/image`
- `onError` handler falls back gracefully if image fails
- Fallback: gradient initial avatar — each letter A-Z gets a unique color gradient
- Sizes: `sm` (28px) and `md` (36px)

**`ProfileMenu` component**
- Pill-shaped trigger: `[Avatar] [FirstName] [ChevronDown]`
- First name extraction: "Muhammad Ali" → "Muhammad", falls back to email username
- Dropdown on click with outside-click close
- Dropdown content: user photo + full name + email header, View Profile, Settings, Sign Out
- Reads from both `user` (Firebase Auth, has photoURL) and `userProfile` (Firestore)

**TopBar update**
- Replaced inline avatar div with `<ProfileMenu />`
- Removed `useAuthStore` from TopBar (moved into ProfileMenu)

---

## Session 5 — Real-time Sidebar History + Firebase Data Fix

### New files
- `src/store/transactionStore.ts`

### What was built

**`transactionStore` (Zustand)**
- Uses Firestore `onSnapshot` for real-time updates
- `startListener(userId)` — starts listener scoped to user
- `stopListener()` — unsubscribes and clears data on logout
- Prevents duplicate listeners
- Silently ignores `permission-denied` errors during sign-out

**`AuthContext` update**
- Calls `startListener` when user logs in
- Calls `stopListener` when user logs out
- Ensures auth loads before any Firestore query runs

**Sidebar rebuild**
- `MiniTransaction` component shows icon, merchant, amount, date
- Reads `transactions` from `transactionStore` — always user-specific
- Loading skeleton (animated placeholder rows)
- Empty state message
- Real-time: updates instantly when any transaction is added/changed

**Dashboard update**
- Replaced `getTransactions` fetch with `useTransactionStore`
- `useMemo` filters by date range client-side
- No manual `loadData()` needed after `addTransaction` — `onSnapshot` handles it
- KPIs and charts re-render automatically when Firestore changes

---

## Session 6 — Transaction History Tab in Sidebar

### Changes made

**Sidebar complete rewrite**

Removed the inline "Recent" section from the sidebar. Replaced with:

**History button**
- Dashed-border pill showing transaction count badge
- Hidden by default — data not visible until clicked

**`HistoryPanel` component** (overlay inside sidebar)
- Slides over sidebar content with `absolute inset-0`
- Search bar — filters by merchant, category, description in real-time
- Filter pills: All / Income / Expense with color coding
- Summary strip showing entry count + total income/expense
- Transactions grouped by date with date headers
- Loading skeleton (5 animated rows)
- Empty states for no data vs no search match

**Collapsed sidebar behavior**
- History icon in collapsed mode
- Clicking auto-expands sidebar first, then opens panel after 320ms delay

---

## Session 7 — PKR Default Currency + Global Currency System

### New files
- `src/hooks/useCurrency.ts`

### Changes made

**`formatCurrency` in utils.ts**
- Default currency changed from `USD` to `PKR`
- PKR and JPY/KRW use 0 decimal places (no cents)
- Locale changed to `en-PK` for proper formatting

**`useCurrency` hook**
- Reads `userProfile?.currency` via Zustand selector
- Returns `{ currency, fmt }` where `fmt(amount)` auto-applies user currency
- Selector pattern: only re-renders when currency changes, not on every profile update

**Default PKR applied everywhere**
- `createUserProfile` defaults to `PKR`
- Signup page defaults to `PKR`
- Login (Google) defaults to `PKR`
- Settings page initial state defaults to `PKR`

**Components updated to use `useCurrency`**
- `TransactionList.tsx` — uses `fmt()`
- `KPICard.tsx` — reads `currency` from hook
- `CategoryDonutChart.tsx` — tooltip uses `currency`
- `AIInputField.tsx` — preview amounts use `fmt()`
- `Sidebar.tsx` (HistoryRow + HistoryPanel) — uses `fmt()`

**Charts updated**
- `SpendingTrendChart.tsx` — tooltip and Y-axis use `formatCurrency(v, currency)`
- `SpendingLineChart.tsx` — tooltip and Y-axis use `formatCurrency(v, currency)`

**Settings page currency selector**
- 20 currencies with flags and symbols
- Card grid (2 columns) — click to select
- Live preview: "Preview: Rs 1,000"
- Search filter for currencies
- "Save to apply" amber warning when selection differs from saved
- Save updates Zustand store immediately so all `useCurrency` hooks re-render

**Pages wired with `useCurrency`**
- `expenses/page.tsx`, `income/page.tsx`, `budgets/page.tsx`
- `goals/page.tsx`, `reports/page.tsx`

---

## Session 8 — FinChat Context AI Brain (Human Understanding Mode)

### Changes made

**`/api/ai-parse` — complete rewrite**

Old behavior: keyword extraction, single transaction, deterministic.

New behavior: contextual reasoning, multiple transactions, story understanding.

Five reasoning steps in the system prompt:
1. Read as a story — understand the real-life situation
2. Identify every financial event
3. For each event, decide income vs expense
4. Extract amount the user personally pays/receives
5. Assign contextually appropriate category

Key improvements:
- Returns **JSON array** (multiple transactions from one input)
- Ignores narrative context ("I had 600 rupees with me" is not a transaction)
- Split bill: "bill was 1200 split among 4" → amount=300, participants=4
- Temperature: 0.15 (slightly creative for context, still structured)
- Handles markdown fences, single object, and array responses
- Validates each entry independently, returns partial results if some fail

**`AIInputField.tsx` — full upgrade**

- Header: `Brain` icon, subtitle "I understand context, not just keywords"
- **Thinking animation**: 5 sequential steps cycle during API call
- **Multi-transaction preview**: each found transaction is a checkable card
- All transactions pre-selected by default
- Select All / None controls
- Summary strip shows total income/expense before saving
- `onConfirm` signature: `(txs: ParsedTransaction[]) => Promise<void>`
- Save button shows count: "Save 3 Transactions"

**All `handleAITransaction` handlers updated**
- `dashboard/page.tsx` — loops array, saves each with `addTransaction`
- `expenses/page.tsx` — same
- `income/page.tsx` — same

---

## Session 9 — Inline Edit Before Save

### Changes made

**`EditForm` component** (inside AIInputField)
- Type toggle (Expense/Income) — auto-resets category when type changes
- Amount + Merchant inputs (grid layout)
- Category picker — colored pill grid, filtered by type
- Payment method pills
- Date + Description inputs
- Apply Changes / Cancel buttons
- Does NOT write to Firebase — only updates local state

**`TxCard` component** — upgraded
- Pencil icon in top-right of every card
- Clicking pencil opens `EditForm` inline (no modal, no page navigation)
- Card body still toggles selection — `e.stopPropagation()` separates the two actions
- Tags row hidden while editing
- Pencil turns to X when edit is open (click again to cancel)

**Main `AIInputField`** — guards added
- `editingIndex` state (only one edit open at a time)
- Amber warning: "Apply or cancel the edit above before saving"
- Save button disabled while any edit is open

---

## Session 10 — Edit Button Polish

**Change**
- Edit button changed from icon-only (24px) to labeled pill button
- Style: `bg-blue-600 text-white font-bold` with `px-2.5 h-7`
- Shows "Edit" text with pencil icon when closed
- Shows "Cancel" text with X icon when edit is open
- Subtle shadow: `shadow-sm shadow-blue-400/30`

---

## Session 11 — Forgot Password + Email Verification

### New pages

**`/forgot-password`**
- `sendPasswordResetEmail()` from Firebase Auth
- Generic success for non-existent emails (prevents account enumeration)
- Success screen shows email + check spam instruction
- "Send to different email" resets form
- Back to Sign In link

**`/verify-email`**
- Shown after signup, blocks dashboard until email verified
- Displays user's email address
- Auto-polls `reload(user)` every 4 seconds — detects verification automatically
- Manual "I've verified — continue" button
- Resend button with 60-second cooldown
- "Use a different account" signs out

### Updated pages

**`/signup`**
- Calls `sendEmailVerification(cred.user)` after account creation
- Redirects to `/verify-email` (not `/dashboard`)
- Password strength meter: Too short / Weak / Fair / Strong
- Show/hide password toggle
- Blue info banner explains verification requirement
- Friendly error messages for each Firebase error code

**`/login`**
- "Forgot password?" link inline next to Password label
- After sign-in: checks `emailVerified` — if false, resends verification email and redirects to `/verify-email`
- Google accounts skip verification (always verified)
- Show/hide password toggle
- Error messages for `user-not-found`, `wrong-password`, `too-many-requests`, etc.

**`AuthContext.tsx`**
- `onSnapshot` listener only starts for `emailVerified` users
- Unverified users can't trigger live Firestore queries

---

## Firebase Configuration Required

Enable in Firebase Console for project `finchat05`:

1. **Authentication** → Sign-in methods:
   - Email/Password: Enabled
   - Google: Enabled

2. **Firestore Database**: Created in production mode

3. **Firestore Rules**: Deploy contents of `firestore.rules`

4. **Email Templates** (optional): Customize verification and reset email templates in Firebase Console → Authentication → Templates

---



## Final File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ai-parse/route.ts       ← Context AI Brain (multi-tx)
│   │   ├── chat/route.ts           ← Groq chat with financial context
│   │   ├── categorize/route.ts     ← AI auto-categorization
│   │   └── insights/route.ts       ← AI financial insights
│   ├── dashboard/page.tsx          ← KPIs + charts + AI input
│   ├── expenses/page.tsx           ← Manual + AI entry tabs
│   ├── income/page.tsx             ← Manual + AI entry tabs
│   ├── budgets/page.tsx            ← Monthly budgets
│   ├── goals/page.tsx              ← Savings goals
│   ├── reports/page.tsx            ← Analytics + PDF/CSV export
│   ├── chat/page.tsx               ← AI assistant
│   ├── notifications/page.tsx      ← Notification center
│   ├── settings/page.tsx           ← Currency + profile + security
│   ├── login/page.tsx              ← Auth + forgot password link
│   ├── signup/page.tsx             ← Auth + email verification send
│   ├── forgot-password/page.tsx    ← Password reset via email
│   ├── verify-email/page.tsx       ← Email verification gate
│   ├── layout.tsx
│   ├── page.tsx                    ← Landing page
│   └── globals.css
├── components/
│   ├── ai/
│   │   └── AIInputField.tsx        ← Context AI + inline edit
│   ├── charts/
│   │   ├── SpendingTrendChart.tsx  ← Area chart (currency-aware)
│   │   ├── SpendingLineChart.tsx   ← Line chart (currency-aware)
│   │   └── CategoryDonutChart.tsx  ← Donut chart (currency-aware)
│   ├── dashboard/
│   │   ├── KPICard.tsx             ← Metric card (currency-aware)
│   │   └── HealthScore.tsx         ← Circular SVG gauge
│   ├── layout/
│   │   ├── Sidebar.tsx             ← Collapsible + history panel
│   │   ├── TopBar.tsx              ← Action pills + date filter
│   │   ├── AppLayout.tsx           ← Layout wrapper
│   │   └── ProfileMenu.tsx         ← Avatar + dropdown
│   ├── transactions/
│   │   ├── TransactionList.tsx     ← Currency-aware list
│   │   └── TransactionForm.tsx     ← Manual entry + AI categorize
│   └── ui/                         ← button, card, input, dialog, etc.
├── contexts/
│   └── AuthContext.tsx             ← Auth listener + tx store init
├── hooks/
│   └── useCurrency.ts              ← Global currency hook
├── lib/
│   ├── firebase.ts
│   ├── firestore.ts                ← All CRUD + seed data
│   └── utils.ts                    ← formatCurrency (PKR default)
├── store/
│   ├── authStore.ts                ← User + profile state
│   ├── filterStore.ts              ← Global date filter
│   ├── transactionStore.ts         ← onSnapshot real-time store
│   └── uiStore.ts                  ← Sidebar collapsed state
└── types/
    └── index.ts                    ← All TypeScript interfaces
```

---

## Key Decisions & Architecture Notes

| Decision | Reason |
|----------|--------|
| Zustand `onSnapshot` store | Single real-time listener for whole app — sidebar, dashboard, pages all sync instantly without prop drilling |
| Client-side date filtering | Avoids Firestore composite index requirement; all txs fetched once per login session |
| PKR as default currency | User is based in Pakistan; easily changed in Settings |
| `useCurrency` hook with selector | Only re-renders components when currency actually changes |
| Email verification gate | Prevents unverified users from accessing any app data |
| AI returns array | Single input can describe multiple events ("Got salary, bought groceries, paid transport") — all extracted in one call |
| Inline edit before save | User can correct AI mistakes without leaving the input field |
| History hidden behind button | Financial data shouldn't be permanently visible — respects privacy |

---

*Last updated: Session 11 — Forgot Password + Email Verification*
