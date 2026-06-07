'use client';
import { useState } from 'react';
import {
  Sparkles, Loader2, Check, X, ArrowUpCircle, ArrowDownCircle,
  Users, AlertCircle, RefreshCw, Brain, CheckCheck, Pencil,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, CATEGORY_COLORS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import type { ParsedTransaction } from '@/types';

/* ── Constants ───────────────────────────────────────────────────────────── */
const EXAMPLES = [
  'Had lunch, bill was 1200 split among 4',
  'Got 70000 salary, paid 2500 grocery and 800 transport',
  'Client paid 15000, then I bought shoes for 3500',
  'Paid rent 25000 and internet bill 1500',
  'Received 5000 pocket money, spent 600 on food',
];

const THINKING_STEPS = [
  'Reading your situation...',
  'Identifying financial events...',
  'Calculating amounts...',
  'Categorising transactions...',
  'Finalising records...',
];

type Stage = 'input' | 'parsing' | 'preview' | 'saving' | 'saved' | 'error';

interface AIInputFieldProps {
  onConfirm: (txs: ParsedTransaction[]) => Promise<void>;
  className?: string;
  placeholder?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Inline Edit Form — shown inside a TxCard when user clicks the pencil
───────────────────────────────────────────────────────────────────────────── */
interface EditFormProps {
  tx: ParsedTransaction;
  onSave: (updated: ParsedTransaction) => void;
  onCancel: () => void;
}

function EditForm({ tx, onSave, onCancel }: EditFormProps) {
  const [form, setForm] = useState({
    type:          tx.type,
    amount:        tx.amount.toString(),
    merchant:      tx.merchant,
    category:      tx.category,
    description:   tx.description,
    paymentMethod: tx.paymentMethod,
    date:          tx.date,
  });

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // If type changes, reset category to first valid option for that type
  const handleTypeChange = (t: 'income' | 'expense') => {
    const cats = t === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setForm((f) => ({
      ...f,
      type: t,
      category: cats.includes(f.category) ? f.category : cats[0],
    }));
  };

  const handleSave = () => {
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) return;
    onSave({
      ...tx,
      type:          form.type,
      amount,
      merchant:      form.merchant.trim() || 'Unknown',
      category:      form.category,
      description:   form.description.trim(),
      paymentMethod: form.paymentMethod,
      date:          form.date,
    });
  };

  return (
    <div
      className="mt-2 p-3 rounded-xl bg-white/80 border border-blue-200 shadow-inner space-y-2.5"
      onClick={(e) => e.stopPropagation()} // prevent card toggle
    >
      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Edit Transaction</p>

      {/* Type toggle */}
      <div className="flex gap-1.5">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-all',
              form.type === t
                ? t === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            )}
          >
            {t === 'income'
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Amount + Merchant row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 font-medium block mb-1">Amount</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 font-medium block mb-1">Merchant / Source</label>
          <Input
            value={form.merchant}
            onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-[10px] text-slate-500 font-medium block mb-1">Category</label>
        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, category: c }))}
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-medium transition-all',
                form.category === c
                  ? 'text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
              style={form.category === c ? { backgroundColor: CATEGORY_COLORS[c] || '#6366f1' } : {}}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Payment method */}
      <div>
        <label className="text-[10px] text-slate-500 font-medium block mb-1">Payment Method</label>
        <div className="flex flex-wrap gap-1">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setForm((f) => ({ ...f, paymentMethod: m }))}
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border',
                form.paymentMethod === m
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white/60 text-slate-600 border-slate-200 hover:border-blue-300'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Date + Description row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 font-medium block mb-1">Date</label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 font-medium block mb-1">Description</label>
          <Input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Edit actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!form.amount || parseFloat(form.amount) <= 0}
          className="gap-1.5 h-8 text-xs flex-1"
        >
          <Check className="w-3 h-3" /> Apply Changes
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="h-8 text-xs gap-1.5">
          <X className="w-3 h-3" /> Cancel
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TxCard — shows transaction summary + edit toggle
───────────────────────────────────────────────────────────────────────────── */
interface TxCardProps {
  tx: ParsedTransaction;
  index: number;
  selected: boolean;
  editing: boolean;
  onToggleSelect: () => void;
  onStartEdit: () => void;
  onSaveEdit: (updated: ParsedTransaction) => void;
  onCancelEdit: () => void;
  fmt: (n: number) => string;
}

function TxCard({
  tx, selected, editing,
  onToggleSelect, onStartEdit, onSaveEdit, onCancelEdit, fmt,
}: TxCardProps) {
  const dot = CATEGORY_COLORS[tx.category] || '#6b7280';

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-150',
        editing
          ? 'bg-white/90 border-blue-300 shadow-md'
          : selected
          ? tx.type === 'income'
            ? 'bg-emerald-50 border-emerald-300 shadow-sm'
            : 'bg-blue-50 border-blue-300 shadow-sm'
          : 'bg-white/50 border-slate-200/60 opacity-60 hover:opacity-80'
      )}
    >
      {/* ── Summary row ── */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer select-none"
        onClick={editing ? undefined : onToggleSelect}
      >
        {/* Checkbox */}
        <div
          className={cn(
            'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
            selected && !editing ? 'bg-blue-600' : 'border-2 border-slate-300 bg-white'
          )}
          onClick={(e) => { e.stopPropagation(); if (!editing) onToggleSelect(); }}
        >
          {selected && !editing && <Check className="w-3 h-3 text-white" />}
        </div>

        {/* Type icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${dot}20` }}
        >
          {tx.type === 'income'
            ? <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
            : <ArrowDownCircle className="w-4 h-4" style={{ color: dot }} />}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{tx.merchant}</p>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5 truncate">{tx.description}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <p className={cn('text-sm font-bold', tx.type === 'income' ? 'text-emerald-700' : 'text-slate-800')}>
                {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
              </p>
              {/* Edit button */}
              <button
                onClick={(e) => { e.stopPropagation(); editing ? onCancelEdit() : onStartEdit(); }}
                title={editing ? 'Cancel edit' : 'Edit this transaction'}
                className={cn(
                  'flex items-center gap-1 px-2.5 h-7 rounded-lg text-xs font-bold transition-all border',
                  editing
                    ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-sm shadow-blue-400/30'
                )}
              >
                {editing
                  ? <><X className="w-3.5 h-3.5" /> Cancel</>
                  : <><Pencil className="w-3.5 h-3.5" /> Edit</>}
              </button>
            </div>
          </div>

          {/* Tags — hidden while editing */}
          {!editing && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: dot }}
              >
                {tx.category}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {tx.paymentMethod}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500">
                {tx.date}
              </span>
              {tx.split && tx.participants && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700 flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" />
                  {tx.participants} people · {fmt(tx.perPersonAmount ?? tx.amount)} each
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500">
                {Math.round((tx.confidence || 0) * 100)}% confidence
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Inline edit form ── */}
      {editing && (
        <div className="px-3 pb-3">
          <EditForm tx={tx} onSave={onSaveEdit} onCancel={onCancelEdit} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main AIInputField
───────────────────────────────────────────────────────────────────────────── */
export function AIInputField({ onConfirm, className, placeholder }: AIInputFieldProps) {
  const { fmt } = useCurrency();

  const [input,        setInput]        = useState('');
  const [stage,        setStage]        = useState<Stage>('input');
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [selected,     setSelected]     = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [errorMsg,     setErrorMsg]     = useState('');

  /* ── helpers ────────────────────────────────────────────────────────── */
  const reset = () => {
    setInput(''); setStage('input'); setTransactions([]);
    setSelected(new Set()); setEditingIndex(null);
    setErrorMsg(''); setThinkingStep(0);
  };

  const toggleSelect = (i: number) => {
    if (editingIndex === i) return; // don't toggle while editing
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const selectAll   = () => setSelected(new Set(transactions.map((_, i) => i)));
  const deselectAll = () => setSelected(new Set());

  const handleSaveEdit = (index: number, updated: ParsedTransaction) => {
    setTransactions((prev) => prev.map((tx, i) => (i === index ? updated : tx)));
    setEditingIndex(null);
    // Make sure the edited card is still selected
    setSelected((prev) => { const s = new Set(prev); s.add(index); return s; });
  };

  /* ── parse ──────────────────────────────────────────────────────────── */
  const handleParse = async () => {
    const text = input.trim();
    if (!text || stage === 'parsing') return;

    setStage('parsing'); setErrorMsg('');
    setTransactions([]); setThinkingStep(0); setEditingIndex(null);

    const stepInterval = setInterval(() => {
      setThinkingStep((s) => Math.min(s + 1, THINKING_STEPS.length - 1));
    }, 600);

    try {
      const res  = await fetch('/api/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
      });
      const data = await res.json().catch(() => ({ error: 'Invalid server response', transactions: [] }));

      if (!res.ok || !data.transactions?.length) {
        setErrorMsg(data.error || 'No financial events found. Try describing what you spent or received.');
        setStage('error'); return;
      }

      const txs = (data.transactions as ParsedTransaction[]).map((tx) => ({
        ...tx, amount: Number(tx.amount), rawInput: text,
      }));
      setTransactions(txs);
      setSelected(new Set(txs.map((_, i) => i)));
      setStage('preview');
    } catch {
      setErrorMsg('Network error. Check your connection and try again.');
      setStage('error');
    } finally {
      clearInterval(stepInterval);
    }
  };

  /* ── confirm ────────────────────────────────────────────────────────── */
  const handleConfirm = async () => {
    if (editingIndex !== null) {
      setErrorMsg('Please finish editing before saving.');
      return;
    }
    const toSave = transactions.filter((_, i) => selected.has(i));
    if (toSave.length === 0 || stage === 'saving') return;

    setStage('saving'); setErrorMsg('');
    try {
      await onConfirm(toSave);
      setStage('saved');
      setTimeout(reset, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(`Save failed: ${msg}`);
      setStage('error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && stage === 'input' && input.trim()) {
      e.preventDefault(); handleParse();
    }
  };

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div className={cn('rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl p-5', className)}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Brain className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Ask FinChat</p>
          <p className="text-[11px] text-slate-400">Describe your situation — AI extracts &amp; you review before saving</p>
        </div>
        {stage !== 'input' && (
          <button onClick={reset} title="Start over"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── INPUT / PARSING ─────────────────────────────────── */}
      {(stage === 'input' || stage === 'parsing') && (
        <>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || 'e.g. "Got salary 70000, spent 800 on groceries and 200 on transport"'}
                disabled={stage === 'parsing'}
                className="pr-8 text-sm"
              />
              {input && stage !== 'parsing' && (
                <button onClick={() => setInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button onClick={handleParse} disabled={!input.trim() || stage === 'parsing'}
              size="sm" className="h-10 px-4 gap-1.5 flex-shrink-0">
              {stage === 'parsing'
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...</>
                : <><Sparkles className="w-3.5 h-3.5" /> Parse</>}
            </Button>
          </div>

          {stage === 'parsing' && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
              <div className="flex gap-1 flex-shrink-0">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              <p className="text-xs text-blue-700 font-medium">{THINKING_STEPS[thinkingStep]}</p>
            </div>
          )}

          {stage !== 'parsing' && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {EXAMPLES.map((ex) => (
                <button key={ex}
                  onClick={() => { setInput(ex); setErrorMsg(''); }}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/60 hover:border-blue-200 transition-all">
                  {ex}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ERROR ───────────────────────────────────────────── */}
      {stage === 'error' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-red-700 mb-0.5">Could not process</p>
              <p className="text-xs text-red-600 leading-relaxed break-words">{errorMsg}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline"
              onClick={() => { setStage('input'); setErrorMsg(''); }}
              className="gap-1.5 h-8 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} className="h-8 text-xs text-slate-400">Clear</Button>
          </div>
        </div>
      )}

      {/* ── PREVIEW ─────────────────────────────────────────── */}
      {(stage === 'preview' || stage === 'saving') && transactions.length > 0 && (
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-xs font-semibold text-slate-700">
                {transactions.length === 1
                  ? 'Found 1 transaction — review &amp; edit if needed'
                  : `Found ${transactions.length} transactions — select, edit, then save`}
              </p>
            </div>
            {transactions.length > 1 && (
              <div className="flex gap-2">
                <button onClick={selectAll}   className="text-[10px] text-blue-600 hover:text-blue-700 font-medium">All</button>
                <span className="text-slate-300 text-[10px]">·</span>
                <button onClick={deselectAll} className="text-[10px] text-slate-400 hover:text-slate-600 font-medium">None</button>
              </div>
            )}
          </div>

          {/* Transaction cards */}
          <div className="space-y-2">
            {transactions.map((tx, i) => (
              <TxCard
                key={i}
                tx={tx}
                index={i}
                selected={selected.has(i)}
                editing={editingIndex === i}
                onToggleSelect={() => toggleSelect(i)}
                onStartEdit={() => setEditingIndex(i)}
                onSaveEdit={(updated) => handleSaveEdit(i, updated)}
                onCancelEdit={() => setEditingIndex(null)}
                fmt={fmt}
              />
            ))}
          </div>

          {/* Edit-in-progress warning */}
          {editingIndex !== null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
              <Pencil className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <p className="text-[10px] text-amber-700 font-medium">
                Apply or cancel the edit above before saving.
              </p>
            </div>
          )}

          {/* Summary strip */}
          {selected.size > 0 && editingIndex === null && (() => {
            const saving       = transactions.filter((_, i) => selected.has(i));
            const totalIncome  = saving.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const totalExpense = saving.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            return (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-100">
                <p className="text-[10px] text-slate-500">{selected.size} of {transactions.length} selected</p>
                <div className="flex gap-3 text-[10px]">
                  {totalIncome  > 0 && <span className="text-emerald-600 font-semibold">+{fmt(totalIncome)}</span>}
                  {totalExpense > 0 && <span className="text-rose-500 font-semibold">−{fmt(totalExpense)}</span>}
                </div>
              </div>
            );
          })()}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={selected.size === 0 || stage === 'saving' || editingIndex !== null}
              className="gap-1.5 h-9 text-xs flex-1"
            >
              {stage === 'saving'
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving {selected.size}...</>
                : <><CheckCheck className="w-3.5 h-3.5" /> Save {selected.size} Transaction{selected.size !== 1 ? 's' : ''}</>}
            </Button>
            <Button size="sm" variant="outline"
              onClick={() => { setStage('input'); setEditingIndex(null); }}
              disabled={stage === 'saving'}
              className="h-9 text-xs gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Re-parse
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} disabled={stage === 'saving'}
              className="h-9 text-xs text-slate-400">
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* ── SAVED ───────────────────────────────────────────── */}
      {stage === 'saved' && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700">Transactions saved</p>
            <p className="text-xs text-emerald-600">Your financial data has been updated</p>
          </div>
        </div>
      )}
    </div>
  );
}
