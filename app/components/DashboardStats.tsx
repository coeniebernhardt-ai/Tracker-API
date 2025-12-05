'use client';

import { teamKPIs } from '../data/teamData';

export function DashboardStats() {
  const stats = [
    {
      label: 'Avg Tickets Handled',
      value: `${teamKPIs.avgTicketsHandled.toFixed(1)}%`,
      target: '80%',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      gradient: 'from-cyan-500 to-blue-600',
      isOnTarget: teamKPIs.avgTicketsHandled >= 80
    },
    {
      label: 'Project Completion',
      value: `${teamKPIs.avgProjectCompletion.toFixed(1)}%`,
      target: '95%',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      gradient: 'from-violet-500 to-purple-600',
      isOnTarget: teamKPIs.avgProjectCompletion >= 95
    },
    {
      label: 'First Response Time',
      value: `${teamKPIs.avgResponseTime}%`,
      target: '100%',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-600',
      isOnTarget: teamKPIs.avgResponseTime >= 100
    },
    {
      label: 'Project Delivery',
      value: `${teamKPIs.projectDeliveryRate}%`,
      target: '70%',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      gradient: 'from-amber-500 to-orange-600',
      isOnTarget: teamKPIs.projectDeliveryRate >= 70
    },
    {
      label: 'Team Engagement',
      value: `${teamKPIs.avgEngagement.toFixed(2)}/3`,
      target: '3.0',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-rose-500 to-pink-600',
      isOnTarget: teamKPIs.avgEngagement >= 2.5
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className="group relative overflow-hidden rounded-2xl bg-slate-800/40 border border-slate-700/50 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-slate-800/60 hover:border-slate-600/50 animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Gradient accent */}
          <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient}`} />
          
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white mb-3 shadow-lg`}>
            {stat.icon}
          </div>
          
          {/* Content */}
          <div>
            <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${stat.isOnTarget ? 'text-white' : 'text-amber-400'}`}>
                {stat.value}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Target: {stat.target}
            </p>
          </div>

          {/* Status indicator */}
          <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${stat.isOnTarget ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        </div>
      ))}
    </div>
  );
}

