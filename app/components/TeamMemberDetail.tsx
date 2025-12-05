'use client';

import { TeamMember } from '../data/teamData';
import { KPICard } from './KPICard';

interface TeamMemberDetailProps {
  member: TeamMember;
  onClose: () => void;
}

export function TeamMemberDetail({ member, onClose }: TeamMemberDetailProps) {
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

  const individualKPIs = member.kpis.filter(k => k.type === 'individual');
  const teamKPIs = member.kpis.filter(k => k.type === 'team');
  const groupKPIs = member.kpis.filter(k => k.type === 'group');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-4xl bg-slate-900 border-l border-slate-700/50 shadow-2xl animate-slide-in overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
          <div className="p-6">
            <div className="flex items-start gap-5">
              {/* Close button */}
              <button 
                onClick={onClose}
                className="shrink-0 w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Avatar */}
              <div className={`shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                {member.avatar}
              </div>
              
              {/* Name and role */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {member.name}
                </h2>
                <p className="text-lg text-slate-400">
                  {member.role}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Role Definition */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Role Definition
            </h3>
            <p className="text-slate-300 leading-relaxed bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
              {member.definition}
            </p>
          </section>

          {/* Responsibilities */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </span>
              Responsibilities
            </h3>
            <div className="space-y-2">
              {member.responsibilities.map((resp, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30"
                >
                  <span className="shrink-0 w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed">{resp}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Individual KPIs */}
          {individualKPIs.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                Individual KPIs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {individualKPIs.map((kpi, index) => (
                  <KPICard key={kpi.id} kpi={kpi} delay={index * 100} />
                ))}
              </div>
            </section>
          )}

          {/* Team KPIs */}
          {teamKPIs.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                Team KPIs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamKPIs.map((kpi, index) => (
                  <KPICard key={kpi.id} kpi={kpi} delay={index * 100} />
                ))}
              </div>
            </section>
          )}

          {/* Group KPIs */}
          {groupKPIs.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Group Impact & Engagement
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {groupKPIs.map((kpi, index) => (
                  <KPICard key={kpi.id} kpi={kpi} delay={index * 100} />
                ))}
              </div>
            </section>
          )}

          {/* KPI Measurement Details */}
          <section className="pb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              Measurement Details
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-700/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left p-3 text-slate-400 font-medium">KPI</th>
                    <th className="text-left p-3 text-slate-400 font-medium">Measurement Formula</th>
                    <th className="text-left p-3 text-slate-400 font-medium">Tracking System</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {member.kpis.map((kpi) => (
                    <tr key={kpi.id} className="bg-slate-800/20 hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-slate-200 font-medium">{kpi.name}</td>
                      <td className="p-3 text-slate-300 font-mono text-xs">{kpi.measurement}</td>
                      <td className="p-3 text-slate-400">{kpi.tracking}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-500 italic">
              Note: The achievement of KPIs will be at the discretion of the Solutions Manager, Coenie Bernhardt, in conjunction with the Executive Management Team.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

