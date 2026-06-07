# FinChat — AI-Powered Personal Finance Assistant

A production-ready full-stack SaaS application for personal finance management, powered by Firebase and Groq AI.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **UI Components**: Custom glassmorphism design system (Radix UI primitives)
- **Charts**: Recharts (Area, Line, Donut — no bar charts)
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Email/Password + Google)
- **AI Engine**: Groq API (llama-3.3-70b-versatile)
- **State**: Zustand
- **PDF Export**: jsPDF

---

## Getting Started

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project.
2. Enable **Authentication** → Sign-in methods: Email/Password and Google.
3. Enable **Firestore Database** (start in production mode).
4. Go to Project Settings → Your apps → Add Web App.
5. Copy the config values.

### 2. Deploy Firestore Security Rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`.

### 3. Groq API Key

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key.

### 4. Environment Variables

Copy `.env.local` and fill in your values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

GROQ_API_KEY=your_groq_api_key
```

### 5. Run Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

### Dashboard
- KPI cards: Income, Expenses, Savings, Budget Remaining
- Financial Health Score (circular progress)
- Income vs Expenses area chart
- Category spending donut chart
- Recent transactions
- AI-generated insights (Groq)

### Expense Management
- Add / Edit / Delete expenses
- AI-powered category suggestion
- Filter by category, search, date range
- Pagination

### Income Tracking
- Add / Edit / Delete income entries
- Income trend line chart
- Category filtering

### Budget System
- Monthly category budgets
- Real-time progress tracking
- Color-coded alerts: On Track / Near Limit (80%) / Over Budget

### Savings Goals
- Create goals with target amounts and deadlines
- Progress tracking with visual indicators
- Days remaining / overdue status

### AI Assistant (Groq)
- Full financial context injection per session
- Natural language Q&A about your finances
- Suggested questions
- Streaming-style chat UI

### Reports
- Summary statistics
- Area + Donut charts
- Budget performance table
- Goals progress
- Export to CSV
- Export to PDF

### Notifications
- Read/unread system
- Budget warning alerts
- Goal completion alerts

### Settings
- Profile management (name, currency)
- Password change
- Notification preferences
- Data export (CSV)
- Account deletion

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes (chat, categorize, insights)
│   ├── dashboard/
│   ├── expenses/
│   ├── income/
│   ├── budgets/
│   ├── goals/
│   ├── reports/
│   ├── chat/
│   ├── notifications/
│   ├── settings/
│   ├── login/
│   ├── signup/
│   └── page.tsx            # Landing page
├── components/
│   ├── ui/                 # Base UI components
│   ├── layout/             # Sidebar, TopBar, AppLayout
│   ├── dashboard/          # KPICard, HealthScore
│   ├── charts/             # Area, Line, Donut charts
│   └── transactions/       # TransactionList, TransactionForm
├── contexts/               # AuthContext
├── lib/                    # Firebase, Firestore helpers, utils
├── store/                  # Zustand stores (auth, filter)
└── types/                  # TypeScript interfaces
```

---

## Security

- Firestore rules enforce `userId` match for all reads/writes
- Authentication required for all data operations
- API routes use server-side Groq key (never exposed to client)

---

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel --prod
```

Set all `NEXT_PUBLIC_*` and `GROQ_API_KEY` environment variables in your Vercel project settings.
