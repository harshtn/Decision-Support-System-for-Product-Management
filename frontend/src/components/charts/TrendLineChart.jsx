import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '../ui/GlassCard';

export default function TrendLineChart({ data = [] }) {
  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Rating vs Sentiment Trend</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(100,116,139,0.4)" />
            <XAxis dataKey="rating" stroke="currentColor" className="text-slate-500 dark:text-slate-400" />
            <YAxis stroke="currentColor" className="text-slate-500 dark:text-slate-400" />
            <Tooltip />
            <Line type="monotone" dataKey="positive" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="neutral" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="negative" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
