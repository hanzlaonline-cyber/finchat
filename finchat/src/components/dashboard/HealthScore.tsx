'use client';

interface HealthScoreProps {
  score: number;
}

export function HealthScore({ score }: HealthScoreProps) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const getColor = () => {
    if (clampedScore >= 75) return ['#10b981', '#059669'];
    if (clampedScore >= 50) return ['#3b82f6', '#6366f1'];
    if (clampedScore >= 25) return ['#f59e0b', '#f97316'];
    return ['#ef4444', '#dc2626'];
  };

  const getLabel = () => {
    if (clampedScore >= 75) return 'Excellent';
    if (clampedScore >= 50) return 'Good';
    if (clampedScore >= 25) return 'Fair';
    return 'Needs Work';
  };

  const [color1, color2] = getColor();

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-black/5 p-5 flex flex-col items-center gap-3">
      <span className="text-sm font-medium text-slate-500 self-start">Financial Health</span>
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <defs>
            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color1} />
              <stop offset="100%" stopColor={color2} />
            </linearGradient>
          </defs>
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="8"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="url(#healthGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-800">{clampedScore}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: color1 }}>{getLabel()}</p>
        <p className="text-xs text-slate-400 mt-0.5">Financial Score</p>
      </div>
    </div>
  );
}
