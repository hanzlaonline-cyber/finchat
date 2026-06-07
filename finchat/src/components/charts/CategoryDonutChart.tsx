'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORY_COLORS, formatCurrency } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

interface CategoryData { name: string; value: number; }

interface CategoryDonutChartProps { data: CategoryData[]; }

function CustomTooltip({ active, payload, currency }: { active?: boolean; payload?: Array<{name: string; value: number}>; currency: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl p-3 shadow-xl">
        <p className="text-sm font-semibold text-slate-700">{payload[0].name}</p>
        <p className="text-sm text-slate-600">{formatCurrency(payload[0].value, currency)}</p>
      </div>
    );
  }
  return null;
}

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const { currency } = useCurrency();
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const top5  = data.slice(0, 5);

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-black/5 p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">Spending by Category</h3>
        <p className="text-xs text-slate-400 mt-0.5">Distribution breakdown</p>
      </div>
      <div className="flex gap-4 items-center">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip content={(props) => <CustomTooltip {...props} currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {top5.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[item.name] || '#6b7280' }} />
                <span className="text-xs text-slate-600 truncate max-w-[100px]">{item.name}</span>
              </div>
              <span className="text-xs font-semibold text-slate-700">
                {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
