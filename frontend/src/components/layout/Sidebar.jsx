import { createElement } from 'react';
import { BarChart3, LayoutDashboard, ListChecks, Scale, ShieldAlert } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Product List', icon: ListChecks },
  { to: '/compare', label: 'Compare Products', icon: Scale },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/company', label: 'Company DSS', icon: ShieldAlert }
];

export default function Sidebar({ open }) {
  return (
    <aside
      className={`
        fixed left-0 top-0 z-50 h-full w-72 p-4 transition-transform duration-300 md:relative md:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="glass-card flex h-full flex-col rounded-2xl p-4">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-4 text-white shadow-lg">
          <p className="text-xs uppercase tracking-[0.25em] text-white/80">DSS Workspace</p>
          <h2 className="mt-1 text-xl font-semibold">Product Intelligence</h2>
          <p className="mt-2 text-sm text-white/80">Monitor sentiment, detect risk, and guide roadmaps.</p>
        </div>

        <nav className="mt-6 space-y-2">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-700 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-slate-800/60'
                }`
              }
            >
              {createElement(icon, { size: 17 })}
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-slate-300/40 bg-white/50 p-3 text-xs text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/50 dark:text-slate-400">
          Search, inspect specs, compare products, and monitor sentiment trends in one place.
        </div>
      </div>
    </aside>
  );
}
