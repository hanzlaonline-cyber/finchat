'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/lib/utils';

interface DataPoint { date: string; amount: number; }
interface SpendingLineChartProps { data: DataPoint[]; title?: string; color?: string; }

export function SpendingLineChart({ data, title = 'Spending Trend', color = '#6366f1' }: SpendingLineChartProps) {
  const { currency } = useCurrency();

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl p-3 shadow-xl">
        <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{formatCurrency(payload[0].value, currency)}</p>
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-black/5 p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
          <Line type="monotone" dataKey="amount" stroke={color} strokeWidth={2.5} dot={{ fill: color, r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
