'use client';
import { formatDate, CATEGORY_COLORS } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import type { Transaction } from '@/types';
import { Pencil, Trash2, CreditCard, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function TransactionList({ transactions, onEdit, onDelete, showActions = true }: TransactionListProps) {
  const { fmt } = useCurrency();

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <CreditCard className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">No transactions found</p>
        <p className="text-xs mt-1">Add your first transaction to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-white/80 border border-white/30 transition-all duration-150 group"
        >
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${CATEGORY_COLORS[tx.category] || '#6b7280'}20` }}
          >
            {tx.type === 'income' ? (
              <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <ArrowDownCircle className="w-5 h-5" style={{ color: CATEGORY_COLORS[tx.category] || '#6b7280' }} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{tx.merchant}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-xs py-0">{tx.category}</Badge>
              <span className="text-xs text-slate-400">{formatDate(tx.date)}</span>
              <span className="text-xs text-slate-400">{tx.paymentMethod}</span>
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-3">
            <span className={cn('text-base font-bold', tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800')}>
              {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
            </span>
            {showActions && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(tx)}>
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50" onClick={() => onDelete(tx.id!)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
