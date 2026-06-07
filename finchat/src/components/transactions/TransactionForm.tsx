'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/lib/utils';
import type { Transaction } from '@/types';
import { Loader2, Sparkles } from 'lucide-react';

interface TransactionFormProps {
  type: 'income' | 'expense';
  initial?: Partial<Transaction>;
  onSubmit: (data: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function TransactionForm({ type, initial, onSubmit, onCancel, loading }: TransactionFormProps) {
  const [form, setForm] = useState({
    amount: initial?.amount?.toString() || '',
    category: initial?.category || '',
    merchant: initial?.merchant || '',
    date: initial?.date || new Date().toISOString().split('T')[0],
    paymentMethod: initial?.paymentMethod || 'Credit Card',
    notes: initial?.notes || '',
  });
  const [aiLoading, setAiLoading] = useState(false);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleAiCategorize = async () => {
    if (!form.merchant && !form.notes) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: `${form.merchant} ${form.notes}`, type }),
      });
      const data = await res.json();
      if (data.category) setForm((f) => ({ ...f, category: data.category }));
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      amount: parseFloat(form.amount),
      type,
      category: form.category,
      merchant: form.merchant,
      date: form.date,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="merchant">{type === 'expense' ? 'Merchant / Payee' : 'Source'}</Label>
        <Input
          id="merchant"
          placeholder={type === 'expense' ? 'e.g. Whole Foods' : 'e.g. Acme Corp'}
          value={form.merchant}
          onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))}
          required
          className="mt-1"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Category</Label>
          <button
            type="button"
            onClick={handleAiCategorize}
            disabled={aiLoading || (!form.merchant && !form.notes)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Suggest
          </button>
        </div>
        <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Payment Method</Label>
        <Select value={form.paymentMethod} onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any notes..."
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="mt-1"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {initial ? 'Update' : 'Add'} {type === 'expense' ? 'Expense' : 'Income'}
        </Button>
      </div>
    </form>
  );
}
