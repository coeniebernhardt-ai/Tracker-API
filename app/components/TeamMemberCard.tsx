'use client';

import { TeamMember } from '../data/teamData';

interface TeamMemberCardProps {
  member: TeamMember;
  onClick: () => void;
  delay?: number;
}

export function TeamMemberCard({ member, onClick, delay = 0 }: TeamMemberCardProps) {
  const individualKPIs = member.kpis.filter(k => k.type === 'individual');
  const avgPerformance = individualKPIs.reduce((acc, kpi) => {
    if (kpi.currentValue === undefined) return acc;
    const perf = (kpi.currentValue / kpi.targetValue) * 100;
    return acc + perf;
  }, 0) / individualKPIs.length;

  const isHighPerformer = avgPerformance >= 100;

  const getAvatarGradient = () => {
    const colors = [
      'from-cyan-400 to-blue-500',
      'from-violet-400 to-purple-500',
      'from-rose-400 to-pink-500',
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-teal-500',
    ];
    const index = member.name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div 
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-800/40 border border-slate-700/50 p-6 backdrop-blur-sm transition-all duration-500 hover:bg-slate-800/60 hover:border-slate-600/50 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-2 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background glow effect */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${getAvatarGradient()} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
      
      {/* Header */}
      <div className="relative flex items-start gap-4 mb-5">
        {/* Avatar */}
        <div className={`relative shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
          {member.avatar}
          {isHighPerformer && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Name and role */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-100 truncate group-hover:text-white transition-colors">
            {member.name}
          </h3>
          <p className="text-sm text-slate-400 truncate">
            {member.role}
          </p>
        </div>

        {/* Arrow indicator */}
        <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="relative grid grid-cols-2 gap-3">
        {individualKPIs.slice(0, 2).map((kpi) => {
          const isOnTarget = kpi.currentValue !== undefined && kpi.currentValue >= kpi.targetValue;
          return (
            <div key={kpi.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-1 truncate">{kpi.name.replace('Number of ', '').replace('On-Time ', '')}</p>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${isOnTarget ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {kpi.currentValue}%
                </span>
                <div className={`w-2 h-2 rounded-full ${isOnTarget ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance indicator bar */}
      <div className="mt-4 pt-4 border-t border-slate-700/30">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-500">Overall Performance</span>
          <span className={`font-medium ${isHighPerformer ? 'text-emerald-400' : 'text-amber-400'}`}>
            {avgPerformance.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${isHighPerformer ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}`}
            style={{ width: `${Math.min(avgPerformance, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

