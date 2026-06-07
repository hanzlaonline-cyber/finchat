'use client';
import { useFilterStore } from '@/store/filterStore';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ProfileMenu } from './ProfileMenu';

const filterOptions = [
  { value: 'today',     label: 'Today' },
  { value: '7days',     label: 'Last 7 days' },
  { value: '30days',    label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'custom',    label: 'Custom Range' },
];

interface TopBarProps {
  title: string;
  subtitle?: string;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
}

export function TopBar({ title, subtitle, onAddIncome, onAddExpense }: TopBarProps) {
  const { dateFilter, setDateFilter } = useFilterStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowCustom(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getLabel = () => {
    if (dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate) {
      return `${format(dateFilter.startDate, 'MMM d')} – ${format(dateFilter.endDate, 'MMM d, yyyy')}`;
    }
    return filterOptions.find((o) => o.value === dateFilter.type)?.label || 'This Month';
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) return;
    const s = new Date(customStart); s.setHours(0, 0, 0, 0);
    const e = new Date(customEnd);   e.setHours(23, 59, 59, 999);
    setDateFilter({ type: 'custom', startDate: s, endDate: e });
    setShowDropdown(false);
    setShowCustom(false);
  };

  const hasActions = onAddIncome || onAddExpense;

  return (
    <div className="bg-white/60 backdrop-blur-md border-b border-white/40 sticky top-0 z-30">
      {/* ── Main title row ──────────────────────────────────── */}
      <div className="h-14 flex items-center justify-between px-6 gap-4">
        {/* Left: title */}
        <div className="flex-shrink-0 min-w-0">
          <h1 className="text-lg font-semibold text-slate-800 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-slate-400 leading-none mt-0.5">{subtitle}</p>}
        </div>

        {/* Right: date filter + avatar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Date range selector — always visible */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => { setShowDropdown(!showDropdown); setShowCustom(false); }}
              className={cn(
                'flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-medium transition-all duration-200',
                'bg-white/80 backdrop-blur-sm border shadow-sm hover:shadow-md',
                showDropdown
                  ? 'border-blue-300 text-blue-700 shadow-blue-100/60'
                  : 'border-white/50 text-slate-600 hover:border-blue-200 hover:text-blue-600'
              )}
            >
              <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              <span className="max-w-[120px] truncate">{getLabel()}</span>
              <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform flex-shrink-0', showDropdown && 'rotate-180')} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-11 z-50 w-52 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl shadow-black/10 overflow-hidden">
                <div className="p-1">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={cn(
                        'w-full text-left px-3.5 py-2 text-sm rounded-xl transition-colors flex items-center gap-2',
                        dateFilter.type === opt.value
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                      onClick={() => {
                        if (opt.value === 'custom') { setShowCustom(true); }
                        else {
                          setDateFilter({ type: opt.value as 'today' | '7days' | '30days' | 'thisMonth' });
                          setShowDropdown(false);
                        }
                      }}
                    >
                      {opt.value === 'custom' && <Calendar className="w-3.5 h-3.5 text-slate-400" />}
                      {opt.label}
                    </button>
                  ))}
                </div>

                {showCustom && (
                  <div className="border-t border-slate-100 p-3 space-y-2.5">
                    <p className="text-xs font-semibold text-slate-500">Custom Range</p>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Start</label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">End</label>
                      <input
                        type="date"
                        value={customEnd}
                        min={customStart}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <Button size="sm" className="w-full h-8 text-xs rounded-xl" onClick={applyCustomRange} disabled={!customStart || !customEnd}>
                      Apply Range
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile menu — avatar + first name + dropdown */}
          <ProfileMenu />
        </div>
      </div>

      {/* ── Action bar — rendered only when actions are provided ── */}
      {hasActions && (
        <div className="flex items-center gap-3 px-6 pb-3 pt-0">
          {onAddIncome && (
            <ActionPill
              label="Add Income"
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              onClick={onAddIncome}
              color="emerald"
            />
          )}
          {onAddExpense && (
            <ActionPill
              label="Add Expense"
              icon={<TrendingDown className="w-3.5 h-3.5" />}
              onClick={onAddExpense}
              color="rose"
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Pill button component ──────────────────────────────────────────── */
interface ActionPillProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: 'emerald' | 'rose';
}

function ActionPill({ label, icon, onClick, color }: ActionPillProps) {
  const styles = {
    emerald: {
      base: 'border-emerald-200/80 text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/90 hover:border-emerald-300 hover:shadow-emerald-200/60',
      dot: 'bg-emerald-400',
    },
    rose: {
      base: 'border-rose-200/80 text-rose-600 bg-rose-50/80 hover:bg-rose-100/90 hover:border-rose-300 hover:shadow-rose-200/60',
      dot: 'bg-rose-400',
    },
  }[color];

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 h-9 px-4 rounded-full text-sm font-semibold',
        'border backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px active:scale-[0.98]',
        styles.base
      )}
    >
      {icon}
      {label}
    </button>
  );
}
