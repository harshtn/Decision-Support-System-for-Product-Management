export default function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-5 animate-pulse">
      <div className="h-4 w-2/3 rounded bg-slate-300/60 dark:bg-slate-700/70" />
      <div className="mt-4 h-8 w-1/2 rounded bg-slate-300/60 dark:bg-slate-700/70" />
      <div className="mt-4 h-3 w-full rounded bg-slate-300/50 dark:bg-slate-700/50" />
      <div className="mt-2 h-3 w-5/6 rounded bg-slate-300/50 dark:bg-slate-700/50" />
    </div>
  );
}
