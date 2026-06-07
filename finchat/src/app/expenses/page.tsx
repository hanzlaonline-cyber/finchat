'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { AIInputField } from '@/components/ai/AIInputField';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { useFilterStore } from '@/store/filterStore';
import { getTransactions, addTransaction, updateTransaction, deleteTransaction } from '@/lib/firestore';
import { EXPENSE_CATEGORIES, formatCurrency } from '@/lib/utils';
import type { Transaction, ParsedTransaction } from '@/types';
import { Plus, Search, Loader2, TrendingDown, Sparkles } from 'lucide-react';

export default function ExpensesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { getDateRange } = useFilterStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { start, end } = getDateRange();
    const txs = await getTransactions(user.uid, start, end);
    setTransactions(txs.filter((t) => t.type === 'expense'));
    setLoading(false);
  }, [user, getDateRange]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const filtered = transactions.filter((t) =>
    (search === '' ||
      t.merchant.toLowerCase().includes(search.toLowerCase()) ||
      t.notes?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()))
    && (categoryFilter === 'all' || t.category === categoryFilter)
  );

  const paginated = filtered.slice(0, page * PER_PAGE);
  const totalFiltered = filtered.reduce((s, t) => s + t.amount, 0);

  const handleAdd = async (data: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    setFormLoading(true);
    try {
      await addTransaction({ ...data, userId: user.uid, type: 'expense' });
      setShowAdd(false);
      await loadData();
    } finally { setFormLoading(false); }
  };

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
    setShowAdd(false);
    await loadData();
  };

  const handleEdit = async (data: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!editTx?.id) return;
    setFormLoading(true);
    try {
      await updateTransaction(editTx.id, data);
      setEditTx(null);
      await loadData();
    } finally { setFormLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    await deleteTransaction(id);
    await loadData();
  };

  return (
    <AppLayout
      title="Expenses"
      subtitle="Track and manage your spending"
      onAddExpense={() => setShowAdd(true)}
    >
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Expenses', value: formatCurrency(totalFiltered), color: 'text-red-600' },
          { label: 'Transactions', value: filtered.length.toString(), color: 'text-slate-800' },
          { label: 'Average', value: filtered.length > 0 ? formatCurrency(totalFiltered / filtered.length) : '$0.00', color: 'text-slate-800' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-5 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowAdd(true)} className="gap-2 flex-shrink-0">
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <TransactionList transactions={paginated} onEdit={(tx) => setEditTx(tx)} onDelete={handleDelete} />
            {paginated.length < filtered.length && (
              <div className="text-center mt-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>Load More</Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Dialog with tabs */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" /> Add Expense
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="manual">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="manual" className="flex-1 gap-1.5">
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex-1 gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Entry
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              <TransactionForm type="expense" onSubmit={handleAdd} onCancel={() => setShowAdd(false)} loading={formLoading} />
            </TabsContent>
            <TabsContent value="ai">
              <AIInputField
                onConfirm={handleAITransaction}
                placeholder='e.g. "Spent $80 on groceries" or "Dinner $300 split among 6"'
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTx} onOpenChange={(o) => !o && setEditTx(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
          {editTx && (
            <TransactionForm type="expense" initial={editTx} onSubmit={handleEdit} onCancel={() => setEditTx(null)} loading={formLoading} />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
