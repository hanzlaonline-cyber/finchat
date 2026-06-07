'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { getBudgets, addBudget, updateBudget, deleteBudget, getTransactions } from '@/lib/firestore';
import { EXPENSE_CATEGORIES, formatCurrency } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import type { Budget } from '@/types';
import { Plus, Trash2, Pencil, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function BudgetsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ category: '', limit: '' });
  const currentMonth = format(new Date(), 'yyyy-MM');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const buds = await getBudgets(user.uid, currentMonth);

    // Update spent amounts from actual transactions
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const txs = await getTransactions(user.uid, monthStart, monthEnd);
    const spentByCategory = txs
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const updated = buds.map((b) => ({ ...b, spent: spentByCategory[b.category] || 0 }));
    setBudgets(updated);
    setLoading(false);
  }, [user, currentMonth]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const openAdd = () => {
    setEditBudget(null);
    setForm({ category: '', limit: '' });
    setShowForm(true);
  };

  const openEdit = (b: Budget) => {
    setEditBudget(b);
    setForm({ category: b.category, limit: b.limit.toString() });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user || !form.category || !form.limit) return;
    setFormLoading(true);
    try {
      if (editBudget?.id) {
        await updateBudget(editBudget.id, { limit: parseFloat(form.limit), category: form.category });
      } else {
        await addBudget({ userId: user.uid, category: form.category, limit: parseFloat(form.limit), spent: 0, month: currentMonth });
      }
      setShowForm(false);
      await loadData();
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    await deleteBudget(id);
    await loadData();
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent  = budgets.reduce((s, b) => s + b.spent, 0);
  const { fmt } = useCurrency();

  return (
    <AppLayout title="Budgets" subtitle="Manage your monthly spending limits">
      {/* Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Budget</p>
          <p className="text-xl font-bold text-slate-800">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Spent</p>
          <p className="text-xl font-bold text-red-500">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Remaining</p>
          <p className={`text-xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(totalBudget - totalSpent)}
          </p>
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-end mb-4">
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Budget
        </Button>
      </div>

      {/* Budget Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-12 text-center text-slate-400">
          <p className="text-sm font-medium">No budgets set</p>
          <p className="text-xs mt-1">Create a budget to track your spending limits</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const pct = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
            const isOver = pct > 100;
            const isWarning = pct >= 80 && !isOver;
            const remaining = budget.limit - budget.spent;

            return (
              <div key={budget.id} className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{budget.category}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{currentMonth}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isOver && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertTriangle className="w-3 h-3" /> Over Budget
                      </Badge>
                    )}
                    {isWarning && (
                      <Badge variant="warning" className="text-xs gap-1">
                        <AlertTriangle className="w-3 h-3" /> Near Limit
                      </Badge>
                    )}
                    {!isOver && !isWarning && pct > 0 && (
                      <Badge variant="success" className="text-xs gap-1">
                        <CheckCircle className="w-3 h-3" /> On Track
                      </Badge>
                    )}
                    <div className="flex gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(budget)} className="p-1 rounded hover:bg-slate-100">
                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => handleDelete(budget.id!)} className="p-1 rounded hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>

                <Progress
                  value={Math.min(100, pct)}
                  className="h-2 mb-3"
                  indicatorClassName={isOver ? 'bg-red-500' : isWarning ? 'bg-amber-400' : undefined}
                />

                <div className="flex justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Spent: </span>
                    <span className={`font-semibold ${isOver ? 'text-red-600' : 'text-slate-700'}`}>{formatCurrency(budget.spent)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Limit: </span>
                    <span className="font-semibold text-slate-700">{formatCurrency(budget.limit)}</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-center">
                  <span className={remaining >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                    {remaining >= 0 ? `${formatCurrency(remaining)} remaining` : `${formatCurrency(Math.abs(remaining))} over budget`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBudget ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="limit">Monthly Limit</Label>
              <Input
                id="limit"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.limit}
                onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={formLoading}>
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editBudget ? 'Update' : 'Create'} Budget
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
