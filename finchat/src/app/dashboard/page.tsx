'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { HealthScore } from '@/components/dashboard/HealthScore';
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart';
import { CategoryDonutChart } from '@/components/charts/CategoryDonutChart';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { AIInputField } from '@/components/ai/AIInputField';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useFilterStore } from '@/store/filterStore';
import { useTransactionStore } from '@/store/transactionStore';
import { getBudgets, getGoals, addTransaction } from '@/lib/firestore';
import type { Transaction, Budget, Goal, ChartDataPoint, ParsedTransaction } from '@/types';
import {
  DollarSign, TrendingUp, TrendingDown, PiggyBank, Target, Lightbulb, Loader2,
} from 'lucide-react';
import { eachDayOfInterval, format } from 'date-fns';

interface Insight { title: string; description: string; }

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { getDateRange: getFilterRange } = useFilterStore();

  // ── Live transactions from the real-time store ──────────────────
  const { transactions: allTransactions, loaded: txLoaded } = useTransactionStore();

  const [budgets, setBudgets]           = useState<Budget[]>([]);
  const [goals, setGoals]               = useState<Goal[]>([]);
  const [insights, setInsights]         = useState<Insight[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showAddIncome, setShowAddIncome]   = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [formLoading, setFormLoading]   = useState(false);

  // ── Filter transactions by selected date range ──────────────────
  const { start, end } = getFilterRange();
  const startStr = start.toISOString().split('T')[0];
  const endStr   = end.toISOString().split('T')[0];

  const transactions = useMemo(
    () => allTransactions.filter((t) => t.date >= startStr && t.date <= endStr),
    [allTransactions, startStr, endStr]
  );

  // ── Fetch budgets + goals (not real-time — less frequent changes) 
  const loadSupporting = useCallback(async () => {
    if (!user) return;
    setBudgetsLoading(true);
    const [buds, gls] = await Promise.all([
      getBudgets(user.uid),
      getGoals(user.uid),
    ]);
    setBudgets(buds);
    setGoals(gls);
    setBudgetsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadSupporting();
  }, [user, loadSupporting]);

  // ── AI insights — refresh whenever filtered transactions change ──
  useEffect(() => {
    if (!txLoaded || transactions.length === 0 || budgetsLoading) return;
    setInsightsLoading(true);
    fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions,
        budgets,
        goals,
        dateRange: `${start.toDateString()} - ${end.toDateString()}`,
      }),
    })
      .then((r) => r.json())
      .then((d) => setInsights(d.insights || []))
      .catch(() => setInsights([]))
      .finally(() => setInsightsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txLoaded, startStr, endStr, budgetsLoading]);

  // ── Handlers ────────────────────────────────────────────────────
  const handleAITransaction = async (parsedList: ParsedTransaction[]) => {
    if (!user) throw new Error('Not authenticated');
    for (const parsed of parsedList) {
      await addTransaction({
        userId: user.uid,
        type: parsed.type,
        amount: Number(parsed.amount),
        category: parsed.category,
        merchant: parsed.merchant || 'Unknown',
        date: parsed.date,
        paymentMethod: parsed.paymentMethod || 'Cash',
        notes: parsed.description || '',
        description: parsed.description || '',
        split: parsed.split === true,
        ...(parsed.split === true && parsed.participants
          ? { participants: Number(parsed.participants), perPersonAmount: Number(parsed.perPersonAmount || parsed.amount) }
          : {}),
      });
    }
    // onSnapshot fires automatically — no manual reload needed
  };

  const handleAddIncome = async (data: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    setFormLoading(true);
    try {
      await addTransaction({ ...data, userId: user.uid, type: 'income' });
      setShowAddIncome(false);
    } finally { setFormLoading(false); }
  };

  const handleAddExpense = async (data: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    setFormLoading(true);
    try {
      await addTransaction({ ...data, userId: user.uid, type: 'expense' });
      setShowAddExpense(false);
    } finally { setFormLoading(false); }
  };

  // ── Loading gate ────────────────────────────────────────────────
  const isLoading = authLoading || !txLoaded || budgetsLoading;

  if (isLoading) {
    return (
      <AppLayout title="Dashboard" onAddIncome={() => setShowAddIncome(true)} onAddExpense={() => setShowAddExpense(true)}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </AppLayout>
    );
  }

  // ── Derived KPI data ─────────────────────────────────────────────
  const income    = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses  = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings   = income - expenses;

  const totalBudget     = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent      = budgets.reduce((s, b) => s + b.spent, 0);
  const remainingBudget = totalBudget - totalSpent;

  const savingsRate     = income > 0 ? (savings / income) * 100 : 0;
  const budgetAdherence = totalBudget > 0 ? Math.max(0, ((totalBudget - totalSpent) / totalBudget) * 100) : 50;
  const healthScore     = Math.min(100, Math.round(savingsRate * 0.5 + budgetAdherence * 0.5));

  const todayStr   = format(new Date(), 'yyyy-MM-dd');
  const todaySpend = transactions.filter((t) => t.type === 'expense' && t.date === todayStr).reduce((s, t) => s + t.amount, 0);

  const categoryMap  = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>);
  const categoryData = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  const days      = eachDayOfInterval({ start, end });
  const chartData: ChartDataPoint[] = days.map((day) => {
    const ds    = format(day, 'yyyy-MM-dd');
    const dayTx = transactions.filter((t) => t.date === ds);
    return {
      date:     format(day, 'MMM d'),
      income:   dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expenses: dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  const recentTxs = transactions.slice(0, 5);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <AppLayout
      title="Dashboard"
      subtitle="Your financial overview"
      onAddIncome={() => setShowAddIncome(true)}
      onAddExpense={() => setShowAddExpense(true)}
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KPICard title="Total Income"   value={income}           icon={TrendingUp}   iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <KPICard title="Total Expenses" value={expenses}         icon={TrendingDown} iconBg="bg-rose-50"    iconColor="text-rose-500" />
        <KPICard title="Net Savings"    value={savings}          icon={PiggyBank}    iconBg="bg-blue-50"    iconColor="text-blue-600" />
        <KPICard title="Today's Spend"  value={todaySpend}       icon={DollarSign}   iconBg="bg-amber-50"   iconColor="text-amber-600" />
        <KPICard title="Budget Left"    value={remainingBudget}  icon={Target}       iconBg="bg-purple-50"  iconColor="text-purple-600" />
        <HealthScore score={healthScore} />
      </div>

      {/* AI quick-input */}
      <AIInputField onConfirm={handleAITransaction} className="mb-6" />

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2">
          <SpendingTrendChart data={chartData} />
        </div>
        <CategoryDonutChart data={categoryData} />
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">Recent Transactions</h3>
            <button onClick={() => router.push('/expenses')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all
            </button>
          </div>
          <TransactionList transactions={recentTxs} showActions={false} />
        </div>

        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">AI Insights</h3>
          </div>

          {insightsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100/50">
                  <p className="text-xs font-semibold text-slate-700 mb-1">{insight.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Add transactions to get AI insights</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showAddIncome} onOpenChange={setShowAddIncome}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Add Income
            </DialogTitle>
          </DialogHeader>
          <TransactionForm type="income" onSubmit={handleAddIncome} onCancel={() => setShowAddIncome(false)} loading={formLoading} />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" /> Add Expense
            </DialogTitle>
          </DialogHeader>
          <TransactionForm type="expense" onSubmit={handleAddExpense} onCancel={() => setShowAddExpense(false)} loading={formLoading} />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
