import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Smile, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import KpiCard from '../components/ui/KpiCard';
import SentimentPieChart from '../components/charts/SentimentPieChart';
import TrendLineChart from '../components/charts/TrendLineChart';
import GlassCard from '../components/ui/GlassCard';
import Loader from '../components/ui/Loader';
import AlertBadge from '../components/ui/AlertBadge';
import { getOverview, getChartData } from '../services/dssService';

const MotionSection = motion.section;

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [charts, setCharts] = useState({ ratingVsSentiment: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [overviewData, chartData] = await Promise.all([getOverview(), getChartData()]);
        setOverview(overviewData);
        setCharts(chartData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const positiveRate = useMemo(() => {
    const dist = overview?.sentimentDist || [];
    const total = dist.reduce((sum, item) => sum + Number(item.count || 0), 0);
    const positive = dist.find((item) => item.label === 'positive')?.count || 0;
    if (!total) return '0%';
    return `${((positive / total) * 100).toFixed(1)}%`;
  }, [overview]);

  const negativeRate = useMemo(() => {
    const dist = overview?.sentimentDist || [];
    const total = dist.reduce((sum, item) => sum + Number(item.count || 0), 0);
    const negative = dist.find((item) => item.label === 'negative')?.count || 0;
    if (!total) return '0%';
    return `${((negative / total) * 100).toFixed(1)}%`;
  }, [overview]);

  if (loading) return <Loader label="Loading dashboard metrics..." />;

  return (
    <div className="space-y-6">
      <MotionSection
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <KpiCard title="Total Reviews" value={overview?.reviewCount || 0} icon={FileText} tone="indigo" delay={0.05} />
        <KpiCard title="Positive %" value={positiveRate} icon={Smile} tone="emerald" delay={0.1} />
        <KpiCard title="Negative %" value={negativeRate} icon={AlertTriangle} tone="rose" delay={0.15} />
      </MotionSection>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SentimentPieChart data={overview?.sentimentDist || []} />
        <TrendLineChart data={charts?.ratingVsSentiment || []} />
      </section>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">DSS Alerts</h3>
          <AlertBadge type={(overview?.dss?.negativeAlerts || []).length ? 'negative' : 'positive'}>
            {(overview?.dss?.negativeAlerts || []).length ? 'Attention Needed' : 'Healthy'}
          </AlertBadge>
        </div>

        {!(overview?.dss?.negativeAlerts || []).length ? (
          <p className="text-slate-600 dark:text-slate-300">
            No products currently exceed the negative sentiment threshold.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {overview.dss.negativeAlerts.map((alert) => (
              <div key={alert.productId} className="rounded-2xl border border-rose-300/40 bg-rose-400/10 p-4 dark:border-rose-800/60 dark:bg-rose-900/20">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{alert.product}</p>
                <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                  Negative rate {(alert.negativeRate * 100).toFixed(1)}% ({alert.negativeCount}/{alert.totalReviews})
                </p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link to="/products" className="glass-card rounded-2xl p-4 text-sm font-semibold text-slate-800 transition hover:scale-[1.01] dark:text-slate-100">
          Explore Product Catalog
        </Link>
        <Link to="/analytics" className="glass-card rounded-2xl p-4 text-sm font-semibold text-slate-800 transition hover:scale-[1.01] dark:text-slate-100">
          Open Advanced Analytics
        </Link>
        <Link to="/company" className="glass-card rounded-2xl p-4 text-sm font-semibold text-slate-800 transition hover:scale-[1.01] dark:text-slate-100">
          Open Company DSS Console
        </Link>
      </section>
    </div>
  );
}
