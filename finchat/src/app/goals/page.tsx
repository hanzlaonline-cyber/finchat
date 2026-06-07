'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { getGoals, addGoal, updateGoal, deleteGoal } from '@/lib/firestore';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Goal } from '@/types';
import { Plus, Trash2, Pencil, Loader2, Target, Calendar, CheckCircle } from 'lucide-react';

export default function GoalsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ goalName: '', targetAmount: '', currentAmount: '', deadline: '', notes: '' });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const gls = await getGoals(user.uid);
    setGoals(gls);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const openAdd = () => {
    setEditGoal(null);
    setForm({ goalName: '', targetAmount: '', currentAmount: '0', deadline: '', notes: '' });
    setShowForm(true);
  };

  const openEdit = (g: Goal) => {
    setEditGoal(g);
    setForm({
      goalName: g.goalName,
      targetAmount: g.targetAmount.toString(),
      currentAmount: g.currentAmount.toString(),
      deadline: g.deadline,
      notes: g.notes || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user || !form.goalName || !form.targetAmount || !form.deadline) return;
    setFormLoading(true);
    try {
      if (editGoal?.id) {
        await updateGoal(editGoal.id, {
          goalName: form.goalName,
          targetAmount: parseFloat(form.targetAmount),
          currentAmount: parseFloat(form.currentAmount || '0'),
          deadline: form.deadline,
          notes: form.notes,
        });
      } else {
        await addGoal({
          userId: user.uid,
          goalName: form.goalName,
          targetAmount: parseFloat(form.targetAmount),
          currentAmount: parseFloat(form.currentAmount || '0'),
          deadline: form.deadline,
          notes: form.notes,
        });
      }
      setShowForm(false);
      await loadData();
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this goal?')) return;
    await deleteGoal(id);
    await loadData();
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <AppLayout title="Goals" subtitle="Track your financial goals and milestones">
      {/* Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Target</p>
          <p className="text-xl font-bold text-slate-800">{formatCurrency(totalTarget)}</p>
        </div>
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Saved</p>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalSaved)}</p>
        </div>
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Goals</p>
          <p className="text-xl font-bold text-slate-800">{goals.length}</p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {/* Goal Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-12 text-center text-slate-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No goals yet</p>
          <p className="text-xs mt-1">Create a savings goal to start tracking your progress</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const isComplete = pct >= 100;
            const remaining = goal.targetAmount - goal.currentAmount;
            const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <div key={goal.id} className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isComplete ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                      {isComplete ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Target className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{goal.goalName}</h3>
                      {goal.notes && <p className="text-xs text-slate-400">{goal.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(goal)} className="p-1 rounded hover:bg-slate-100">
                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button onClick={() => handleDelete(goal.id!)} className="p-1 rounded hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-semibold text-slate-700">{Math.min(100, pct).toFixed(0)}%</span>
                  </div>
                  <Progress
                    value={Math.min(100, pct)}
                    indicatorClassName={isComplete ? 'bg-emerald-500' : undefined}
                  />
                </div>

                <div className="flex justify-between text-xs mt-2">
                  <div>
                    <span className="text-slate-400">Saved: </span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(goal.currentAmount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Target: </span>
                    <span className="font-semibold text-slate-700">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(goal.deadline)}
                  </div>
                  {isComplete ? (
                    <Badge variant="success" className="text-xs">Goal Reached</Badge>
                  ) : daysLeft > 0 ? (
                    <Badge variant={daysLeft < 30 ? 'warning' : 'default'} className="text-xs">
                      {daysLeft} days left
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">Overdue</Badge>
                  )}
                </div>

                {!isComplete && (
                  <p className="text-xs text-center text-slate-400 mt-2">
                    {formatCurrency(remaining)} to go
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goalName">Goal Name</Label>
              <Input id="goalName" placeholder="e.g. Emergency Fund" value={form.goalName} onChange={(e) => setForm((f) => ({ ...f, goalName: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="target">Target Amount</Label>
                <Input id="target" type="number" step="0.01" min="0" placeholder="0.00" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="current">Current Amount</Label>
                <Input id="current" type="number" step="0.01" min="0" placeholder="0.00" value={form.currentAmount} onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="deadline">Target Date</Label>
              <Input id="deadline" type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" placeholder="Why is this goal important?" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="mt-1" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={formLoading}>
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editGoal ? 'Update' : 'Create'} Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
