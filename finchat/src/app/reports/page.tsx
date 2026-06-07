'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useFilterStore } from '@/store/filterStore';
import { getTransactions, getBudgets, getGoals } from '@/lib/firestore';
import { formatCurrency, CATEGORY_COLORS } from '@/lib/utils';
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart';
import { CategoryDonutChart } from '@/components/charts/CategoryDonutChart';
import type { Transaction, Budget, Goal, ChartDataPoint } from '@/types';
import { Download, FileText, Loader2 } from 'lucide-react';
import { eachDayOfInterval, format, eachMonthOfInterval, subMonths } from 'date-fns';

export default function ReportsPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuthStore();
  const { getDateRange } = useFilterStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { start, end } = getDateRange();
    const [txs, buds, gls] = await Promise.all([
      getTransactions(user.uid, start, end),
      getBudgets(user.uid),
      getGoals(user.uid),
    ]);
    setTransactions(txs);
    setBudgets(buds);
    setGoals(gls);
    setLoading(false);
  }, [user, getDateRange]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  if (loading) {
    return (
      <AppLayout title="Reports">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </AppLayout>
    );
  }

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = income - expenses;

  const categoryData = Object.entries(
    transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  const { start, end } = getDateRange();
  const days = eachDayOfInterval({ start, end });
  const chartData: ChartDataPoint[] = days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayTxs = transactions.filter((t) => t.date === dayStr);
    return {
      date: format(day, 'MMM d'),
      income: dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expenses: dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  // Monthly trend (last 6 months)
  const monthlyData = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() }).map((month) => {
    const monthStr = format(month, 'yyyy-MM');
    const monthTxs = transactions.filter((t) => t.date.startsWith(monthStr));
    return {
      date: format(month, 'MMM yy'),
      income: monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expenses: monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  const exportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Category', 'Merchant', 'Amount', 'Payment Method', 'Notes'],
      ...transactions.map((t) => [
        t.date, t.type, t.category, t.merchant,
        t.type === 'expense' ? `-${t.amount}` : t.amount.toString(),
        t.paymentMethod, t.notes || '',
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finchat-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    setExportLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const now = format(new Date(), 'MMMM d, yyyy');

      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('FinChat Financial Report', 20, 20);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${now}  |  User: ${userProfile?.displayName || 'User'}`, 20, 32);

      // Summary
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Summary', 20, 55);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const summaryItems = [
        ['Total Income:', formatCurrency(income)],
        ['Total Expenses:', formatCurrency(expenses)],
        ['Net Savings:', formatCurrency(savings)],
        ['Savings Rate:', income > 0 ? `${((savings / income) * 100).toFixed(1)}%` : '0%'],
        ['Transactions:', transactions.length.toString()],
      ];
      summaryItems.forEach(([label, value], i) => {
        doc.text(label, 20, 68 + i * 10);
        doc.text(value, 120, 68 + i * 10);
      });

      // Category breakdown
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Spending by Category', 20, 128);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      categoryData.slice(0, 8).forEach(({ name, value }, i) => {
        const pct = expenses > 0 ? ((value / expenses) * 100).toFixed(1) : '0';
        doc.text(`${name}:`, 20, 140 + i * 10);
        doc.text(formatCurrency(value), 100, 140 + i * 10);
        doc.text(`${pct}%`, 160, 140 + i * 10);
      });

      // Transactions
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Transaction History', 20, 20);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', 20, 32);
      doc.text('Merchant', 50, 32);
      doc.text('Category', 100, 32);
      doc.text('Amount', 155, 32);
      doc.line(20, 34, 190, 34);

      doc.setFont('helvetica', 'normal');
      transactions.slice(0, 40).forEach((t, i) => {
        const y = 42 + i * 7;
        if (y > 280) return;
        doc.text(t.date, 20, y);
        doc.text(t.merchant.substring(0, 20), 50, y);
        doc.text(t.category.substring(0, 18), 100, y);
        const amtText = `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}`;
        doc.setTextColor(t.type === 'income' ? 5 : 220, t.type === 'income' ? 150 : 38, t.type === 'income' ? 105 : 38);
        doc.text(amtText, 155, y);
        doc.setTextColor(30, 41, 59);
      });

      doc.save(`finchat-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <AppLayout title="Reports" subtitle="Financial reports and analytics">
      {/* Export buttons */}
      <div className="flex justify-end gap-3 mb-6">
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
        <Button onClick={exportPDF} disabled={exportLoading} className="gap-2">
          {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Export PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Income', value: formatCurrency(income), color: 'text-emerald-600' },
          { label: 'Total Expenses', value: formatCurrency(expenses), color: 'text-red-500' },
          { label: 'Net Savings', value: formatCurrency(savings), color: savings >= 0 ? 'text-blue-600' : 'text-red-600' },
          { label: 'Savings Rate', value: income > 0 ? `${((savings / income) * 100).toFixed(1)}%` : '0%', color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2">
          <SpendingTrendChart data={chartData} />
        </div>
        <CategoryDonutChart data={categoryData} />
      </div>

      {/* Monthly Trend */}
      <div className="mb-6">
        <SpendingTrendChart data={monthlyData} />
      </div>

      {/* Budget Summary */}
      {budgets.length > 0 && (
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-6 mb-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Budget Performance</h3>
          <div className="space-y-3">
            {budgets.map((b) => {
              const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
              return (
                <div key={b.id} className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 w-36 flex-shrink-0">{b.category}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct > 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 w-16 text-right">{pct.toFixed(0)}%</span>
                  <span className="text-xs text-slate-400 w-28 text-right">{formatCurrency(b.spent)} / {formatCurrency(b.limit)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goals Progress */}
      {goals.length > 0 && (
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Goals Progress</h3>
          <div className="space-y-3">
            {goals.map((g) => {
              const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
              return (
                <div key={g.id} className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 w-36 flex-shrink-0 truncate">{g.goalName}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 w-16 text-right">{pct.toFixed(0)}%</span>
                  <span className="text-xs text-slate-400 w-40 text-right">{formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
