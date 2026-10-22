import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'indigo' }) {
  const colorStyles = {
    indigo: {
      bg: 'bg-indigo-50/60',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    emerald: {
      bg: 'bg-emerald-50/60',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50/60',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    purple: {
      bg: 'bg-purple-50/60',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
  };

  const style = colorStyles[color] || colorStyles.indigo;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${style.bg} ${style.border} border flex items-center justify-center ${style.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtitle && (
        <p className="mt-2.5 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
