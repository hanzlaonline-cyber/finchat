'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Target,
  PieChart,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Wallet,
  Bell,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  X,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { cn, CATEGORY_COLORS, formatShortDate } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useEffect, useState, useMemo } from 'react';
import { getNotifications } from '@/lib/firestore';
import type { Transaction } from '@/types';

/* ─────────────────────────────────────────────────────────────────────────────
   Nav items
───────────────────────────────────────────────────────────────────────────── */
const navItems = [
  { href: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/expenses',  label: 'Expenses',     icon: CreditCard },
  { href: '/income',    label: 'Income',       icon: TrendingUp },
  { href: '/budgets',   label: 'Budgets',      icon: PieChart },
  { href: '/goals',     label: 'Goals',        icon: Target },
  { href: '/reports',   label: 'Reports',      icon: FileText },
  { href: '/chat',      label: 'AI Assistant', icon: MessageSquare },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Single history row
───────────────────────────────────────────────────────────────────────────── */
function HistoryRow({ tx }: { tx: Transaction }) {
  const dot = CATEGORY_COLORS[tx.category] || '#6b7280';
  const { fmt } = useCurrency();
  return (
    <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-white/50 transition-colors">
      {/* Icon */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${dot}18` }}
      >
        {tx.type === 'income' ? (
          <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <ArrowDownCircle className="w-3.5 h-3.5" style={{ color: dot }} />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700 truncate leading-tight">
          {tx.merchant}
        </p>
        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
          {tx.category} · {formatShortDate(tx.date)}
        </p>
      </div>

      {/* Amount */}
      <span
        className={cn(
          'text-xs font-bold flex-shrink-0 ml-1',
          tx.type === 'income' ? 'text-emerald-600' : 'text-slate-700'
        )}
      >
        {tx.type === 'income' ? '+' : '−'}
        {fmt(tx.amount)}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   History panel — slides in over the sidebar content
───────────────────────────────────────────────────────────────────────────── */
interface HistoryPanelProps {
  transactions: Transaction[];
  loaded: boolean;
  onClose: () => void;
}

function HistoryPanel({ transactions, loaded, onClose }: HistoryPanelProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const { fmt } = useCurrency();

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType  = filter === 'all' || tx.type === filter;
      const matchesSearch =
        search === '' ||
        tx.merchant.toLowerCase().includes(search.toLowerCase()) ||
        tx.category.toLowerCase().includes(search.toLowerCase()) ||
        (tx.description || '').toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [transactions, search, filter]);

  // Group by date label
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of filtered) {
      const key = tx.date; // YYYY-MM-DD
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return map;
  }, [filtered]);

  const incomeTotal  = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseTotal = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white/90 backdrop-blur-xl rounded-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-800">Transaction History</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white/80 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 h-6 rounded-full text-[10px] font-semibold transition-all',
                filter === f
                  ? f === 'income'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : f === 'expense'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              {f === 'all' ? 'All' : f === 'income' ? 'Income' : 'Expense'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      {filtered.length > 0 && (
        <div className="mx-3 mb-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100/50 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-slate-500">{filtered.length} entries</span>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-emerald-600 font-semibold">+{fmt(incomeTotal)}</span>
            <span className="text-slate-300">·</span>
            <span className="text-rose-500 font-semibold">−{fmt(expenseTotal)}</span>
          </div>
        </div>
      )}

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 min-h-0">
        {!loaded ? (
          /* Loading skeleton */
          <div className="space-y-1 px-1 pt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 px-3 animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-2 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="h-2.5 bg-slate-200 rounded w-12" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <History className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-xs font-medium text-slate-400">
              {search || filter !== 'all' ? 'No matching transactions' : 'No transactions yet'}
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              {search ? 'Try a different search term' : 'Add your first transaction above'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {Array.from(grouped.entries()).map(([dateKey, txs]) => (
              <div key={dateKey}>
                {/* Date header */}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1">
                  {formatShortDate(dateKey)}
                </p>
                <div className="space-y-0.5">
                  {txs.map((tx) => (
                    <HistoryRow key={tx.id} tx={tx} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Sidebar
───────────────────────────────────────────────────────────────────────────── */
export function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { transactions, loaded } = useTransactionStore();

  const [unreadCount,   setUnreadCount]   = useState(0);
  const [historyOpen,   setHistoryOpen]   = useState(false);

  /* Notification count */
  useEffect(() => {
    if (!user || authLoading) return;
    getNotifications(user.uid)
      .then((notifs) => setUnreadCount(notifs.filter((n) => !n.read).length))
      .catch(() => {});
  }, [user, authLoading]);

  /* Close history if sidebar collapses */
  useEffect(() => {
    if (sidebarCollapsed) setHistoryOpen(false);
  }, [sidebarCollapsed]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white/70 backdrop-blur-xl border-r border-white/40 shadow-xl flex flex-col z-40 transition-all duration-300 ease-in-out overflow-hidden',
        sidebarCollapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* ── Logo + collapse toggle ────────────────────────── */}
      <div
        className={cn(
          'flex items-center border-b border-white/30 h-16 flex-shrink-0',
          sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'
        )}
      >
        {!sidebarCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-base font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent whitespace-nowrap">
                FinChat
              </span>
              <p className="text-[10px] text-slate-400 -mt-0.5 whitespace-nowrap">Finance Assistant</p>
            </div>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link href="/dashboard">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wallet className="w-4 h-4 text-white" />
            </div>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all flex-shrink-0',
            sidebarCollapsed ? 'absolute -right-3 top-[26px] bg-white border border-slate-100 shadow-md' : ''
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="py-3 px-2 space-y-0.5 overflow-x-hidden flex-shrink-0">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={sidebarCollapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
                sidebarCollapsed ? 'justify-center' : ''
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} />
              {!sidebarCollapsed && (
                <>
                  <span className="truncate">{label}</span>
                  {label === 'AI Assistant' && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 font-semibold border border-blue-200/50 flex-shrink-0">
                      AI
                    </span>
                  )}
                </>
              )}
              {sidebarCollapsed && (
                <span className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── History button (expanded mode) ───────────────── */}
      {!sidebarCollapsed && (
        <div className="px-2 pb-1 flex-shrink-0">
          <button
            onClick={() => setHistoryOpen(true)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
              'text-slate-600 hover:bg-white/60 hover:text-slate-900 border border-dashed border-slate-200/80 hover:border-blue-200'
            )}
          >
            <History className="w-4 h-4 text-slate-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
            <span>History</span>
            {loaded && transactions.length > 0 && (
              <span className="ml-auto px-1.5 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-700 font-bold flex-shrink-0">
                {transactions.length > 99 ? '99+' : transactions.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── History icon (collapsed mode) ─────────────────── */}
      {sidebarCollapsed && (
        <div className="px-2 pb-1 flex-shrink-0">
          <button
            onClick={() => {
              /* Expand sidebar first, then open history */
              toggleSidebar();
              setTimeout(() => setHistoryOpen(true), 320);
            }}
            title="Transaction History"
            className="w-full flex items-center justify-center px-2.5 py-2.5 rounded-xl text-slate-600 hover:bg-white/60 transition-all group relative"
          >
            <History className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
            <span className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
              Transaction History
            </span>
          </button>
        </div>
      )}

      {/* ── Spacer ───────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Bottom actions ───────────────────────────────── */}
      <div className="py-3 px-2 border-t border-white/30 space-y-0.5 flex-shrink-0">
        {/* Notifications */}
        <Link
          href="/notifications"
          title={sidebarCollapsed ? 'Notifications' : undefined}
          className={cn(
            'flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:bg-white/60 hover:text-slate-900 relative group',
            sidebarCollapsed ? 'justify-center' : ''
          )}
        >
          <div className="relative flex-shrink-0">
            <Bell className="w-4 h-4 text-slate-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {!sidebarCollapsed && (
            <>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </>
          )}
          {sidebarCollapsed && (
            <span className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
              Notifications
            </span>
          )}
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          title={sidebarCollapsed ? 'Settings' : undefined}
          className={cn(
            'flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
            pathname === '/settings'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
            sidebarCollapsed ? 'justify-center' : ''
          )}
        >
          <Settings className={cn('w-4 h-4 flex-shrink-0', pathname === '/settings' ? 'text-white' : 'text-slate-400')} />
          {!sidebarCollapsed && <span>Settings</span>}
          {sidebarCollapsed && (
            <span className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
              Settings
            </span>
          )}
        </Link>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          title={sidebarCollapsed ? 'Sign Out' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200 relative group',
            sidebarCollapsed ? 'justify-center' : ''
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>Sign Out</span>}
          {sidebarCollapsed && (
            <span className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
              Sign Out
            </span>
          )}
        </button>
      </div>

      {/* ── History panel overlay ─────────────────────────── */}
      {historyOpen && !sidebarCollapsed && (
        <HistoryPanel
          transactions={transactions}
          loaded={loaded}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </aside>
  );
}
