import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import GlassCard from '../ui/GlassCard';

const COLORS = {
  positive: '#34d399',
  neutral: '#f59e0b',
  negative: '#f43f5e'
};

export default function SentimentPieChart({ data = [] }) {
  const chartData = data.map((item) => ({
    label: item.label,
    count: Number(item.count || 0)
  }));

  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Sentiment Distribution</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={92}
              innerRadius={52}
              paddingAngle={4}
            >
              {chartData.map((entry) => (
                <Cell key={entry.label} fill={COLORS[entry.label] || '#6366f1'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
