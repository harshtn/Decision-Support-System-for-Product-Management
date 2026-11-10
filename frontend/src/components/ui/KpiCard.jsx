import { motion } from 'framer-motion';
import GlassCard from './GlassCard';

const MotionBox = motion.div;

export default function KpiCard({ title, value, change, icon: Icon, tone = 'indigo', delay = 0 }) {
  const accent = {
    indigo: 'from-indigo-500/20 to-blue-500/10 text-indigo-600 dark:text-indigo-300',
    emerald: 'from-emerald-500/20 to-cyan-500/10 text-emerald-600 dark:text-emerald-300',
    rose: 'from-rose-500/20 to-purple-500/10 text-rose-600 dark:text-rose-300'
  };

  return (
    <GlassCard className="p-5" delay={delay}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          {change ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{change}</p> : null}
        </div>
        {Icon ? (
          <MotionBox
            whileHover={{ scale: 1.08 }}
            className={`rounded-2xl bg-gradient-to-br p-3 ${accent[tone] || accent.indigo}`}
          >
            <Icon size={20} />
          </MotionBox>
        ) : null}
      </div>
    </GlassCard>
  );
}
