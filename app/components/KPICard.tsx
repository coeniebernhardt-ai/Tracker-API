'use client';

import { KPI } from '../data/teamData';

interface KPICardProps {
  kpi: KPI;
  delay?: number;
}

export function KPICard({ kpi, delay = 0 }: KPICardProps) {
  const percentage = kpi.currentValue !== undefined 
    ? kpi.id === 'engagement' 
      ? (kpi.currentValue / kpi.targetValue) * 100
      : kpi.currentValue
    : 0;
  
  const isOnTarget = kpi.currentValue !== undefined && kpi.currentValue >= kpi.targetValue;
  
  const getTypeColor = () => {
    switch (kpi.type) {
      case 'individual': return 'from-cyan-500 to-blue-600';
      case 'team': return 'from-violet-500 to-purple-600';
      case 'group': return 'from-amber-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getTypeBadgeColor = () => {
    switch (kpi.type) {
      case 'individual': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'team': return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
      case 'group': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const displayValue = kpi.id === 'engagement' 
    ? `${kpi.currentValue?.toFixed(1)}/3`
    : `${kpi.currentValue}%`;

  return (
    <div 
      className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getTypeColor()}`} />
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeColor()} mb-2`}>
            {kpi.type.charAt(0).toUpperCase() + kpi.type.slice(1)} KPI
          </span>
          <h3 className="text-sm font-semibold text-slate-100 leading-tight">
            {kpi.name}
          </h3>
        </div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${isOnTarget ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
          {isOnTarget ? (
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
      </div>

      {/* Value display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${isOnTarget ? 'text-emerald-400' : 'text-rose-400'}`}>
            {displayValue}
          </span>
          <span className="text-sm text-slate-400">
            / {kpi.id === 'engagement' ? '3' : `${kpi.targetValue}%`} target
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden mb-4">
        <div 
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${getTypeColor()} transition-all duration-1000 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        {/* Target marker */}
        <div 
          className="absolute top-0 w-0.5 h-full bg-white/50"
          style={{ left: `${kpi.id === 'engagement' ? 100 : kpi.targetValue}%` }}
        />
      </div>

      {/* Details */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <span className="text-slate-500 shrink-0">Target:</span>
          <span className="text-slate-300">{kpi.target}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-slate-500 shrink-0">Tracking:</span>
          <span className="text-slate-300">{kpi.tracking}</span>
        </div>
      </div>

      {/* Hover effect glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br ${getTypeColor()} blur-3xl -z-10`} style={{ transform: 'scale(0.5)', opacity: 0.1 }} />
    </div>
  );
}

export function KPICardCompact({ kpi }: { kpi: KPI }) {
  const percentage = kpi.currentValue !== undefined 
    ? kpi.id === 'engagement' 
      ? (kpi.currentValue / kpi.targetValue) * 100
      : kpi.currentValue
    : 0;
  
  const isOnTarget = kpi.currentValue !== undefined && kpi.currentValue >= kpi.targetValue;
  
  const getTypeColor = () => {
    switch (kpi.type) {
      case 'individual': return 'from-cyan-500 to-blue-600';
      case 'team': return 'from-violet-500 to-purple-600';
      case 'group': return 'from-amber-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const displayValue = kpi.id === 'engagement' 
    ? `${kpi.currentValue?.toFixed(1)}/3`
    : `${kpi.currentValue}%`;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 truncate">{kpi.name}</p>
        <p className={`text-lg font-bold ${isOnTarget ? 'text-emerald-400' : 'text-rose-400'}`}>
          {displayValue}
        </p>
      </div>
      <div className="w-16 h-16 relative">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-slate-700/50"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="url(#gradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 176} 176`}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={isOnTarget ? 'text-emerald-400' : 'text-rose-400'} stopColor="currentColor" />
              <stop offset="100%" className={isOnTarget ? 'text-emerald-600' : 'text-rose-600'} stopColor="currentColor" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isOnTarget ? (
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

