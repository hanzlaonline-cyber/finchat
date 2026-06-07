'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/lib/utils';
import type { ChartDataPoint } from '@/types';

interface SpendingTrendChartProps { data: ChartDataPoint[]; }

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  const { currency } = useCurrency();

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl p-3 shadow-xl">
        <p className="text-xs font-semibold text-slate-500 mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 capitalize">{entry.name}:</span>
            <span className="font-semibold text-slate-800">{formatCurrency(entry.value, currency)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-black/5 p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">Income vs Expenses</h3>
        <p className="text-xs text-slate-400 mt-0.5">Trend over time</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, '')}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            formatter={(value) => <span className="text-slate-600 capitalize">{value}</span>}
          />
          <Area type="monotone" dataKey="income"   stroke="#10b981" strokeWidth={2} fill="url(#incomeGradient)" />
          <Area type="monotone" dataKey="expenses" stroke="#6366f1" strokeWidth={2} fill="url(#expensesGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
