import { Moon, Sparkles, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionContainer = motion.div;

export default function Navbar({ onToggleSidebar, isDark, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4 md:px-6">
      <MotionContainer
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card flex items-center justify-between rounded-2xl px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle Sidebar"
            className="rounded-xl border border-slate-300/50 p-2 text-slate-700 transition hover:bg-white/60 dark:border-slate-700/70 dark:text-slate-200 dark:hover:bg-slate-800/70"
            onClick={onToggleSidebar}
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="mt-1.5 block h-0.5 w-5 bg-current" />
            <span className="mt-1.5 block h-0.5 w-5 bg-current" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">AI Decision System</p>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Sentiment Intelligence Studio</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300 md:inline-flex">
            <Sparkles size={14} className="mr-1.5" /> Live AI Insights
          </span>
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-xl border border-slate-300/50 p-2 text-slate-700 transition hover:bg-white/60 dark:border-slate-700/70 dark:text-slate-200 dark:hover:bg-slate-800/70"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </MotionContainer>
    </header>
  );
}
