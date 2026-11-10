const colorMap = {
  positive: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/30',
  neutral: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/30',
  negative: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/30'
};

export default function AlertBadge({ type = 'neutral', children }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${colorMap[type] || colorMap.neutral}`}>
      {children}
    </span>
  );
}
