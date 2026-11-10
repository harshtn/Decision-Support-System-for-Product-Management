import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProductComparisonChart from '../components/charts/ProductComparisonChart';
import RatingSentimentChart from '../components/charts/RatingSentimentChart';
import SentimentPieChart from '../components/charts/SentimentPieChart';
import Loader from '../components/ui/Loader';
import { getChartData } from '../services/dssService';

const MotionPage = motion.div;

export default function AnalyticsPage() {
  const [data, setData] = useState({
    sentimentDistribution: [],
    productWiseSentiment: [],
    ratingVsSentiment: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const chartData = await getChartData();
        setData(chartData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <Loader label="Loading analytics charts..." />;

  return (
    <MotionPage
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-6"
    >
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SentimentPieChart data={data.sentimentDistribution || []} />
        <RatingSentimentChart data={data.ratingVsSentiment || []} />
      </section>
      <ProductComparisonChart data={data.productWiseSentiment || []} />
    </MotionPage>
  );
}
