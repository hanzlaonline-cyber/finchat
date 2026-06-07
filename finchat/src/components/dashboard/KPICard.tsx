'use client';
import { cn, formatCurrency } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  format?: 'currency' | 'number' | 'percent';
  className?: string;
}

export function KPICard({
  title,
  value,
  previousValue,
  icon: Icon,
  iconBg,
  iconColor,
  format = 'currency',
  className,
}: KPICardProps) {
  // Always use the user's preferred currency
  const { currency } = useCurrency();

  const change =
    previousValue !== undefined && previousValue !== 0
      ? ((value - previousValue) / Math.abs(previousValue)) * 100
      : null;
  const isPositive = change !== null ? change >= 0 : null;

  const formattedValue =
    format === 'currency'
      ? formatCurrency(value, currency)
      : format === 'percent'
      ? `${value.toFixed(1)}%`
      : value.toLocaleString();

  return (
    <div className={cn('rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-black/5 p-5 flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{formattedValue}</div>
        {change !== null && (
          <div className={cn('flex items-center gap-1 mt-1 text-xs font-medium', isPositive ? 'text-emerald-600' : 'text-red-500')}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(change).toFixed(1)}% vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
}
