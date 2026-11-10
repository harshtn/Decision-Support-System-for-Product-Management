import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '../ui/GlassCard';

export default function RatingSentimentChart({ data = [] }) {
  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Sentiment Volume by Rating</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(100,116,139,0.4)" />
            <XAxis dataKey="rating" stroke="currentColor" className="text-slate-500 dark:text-slate-400" />
            <YAxis stroke="currentColor" className="text-slate-500 dark:text-slate-400" />
            <Tooltip />
            <Area type="monotone" dataKey="positive" stackId="1" stroke="#10b981" fill="#10b98166" />
            <Area type="monotone" dataKey="neutral" stackId="1" stroke="#f59e0b" fill="#f59e0b66" />
            <Area type="monotone" dataKey="negative" stackId="1" stroke="#e11d48" fill="#e11d4866" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
