import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GlassCard from '../ui/GlassCard';

export default function ProductComparisonChart({ data = [] }) {
  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Product-wise Sentiment</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(100,116,139,0.4)" />
            <XAxis dataKey="product" interval={0} angle={-18} textAnchor="end" height={84} stroke="currentColor" className="text-slate-500 dark:text-slate-400" />
            <YAxis stroke="currentColor" className="text-slate-500 dark:text-slate-400" />
            <Tooltip />
            <Legend />
            <Bar dataKey="positive" stackId="sentiment" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="neutral" stackId="sentiment" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="negative" stackId="sentiment" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
