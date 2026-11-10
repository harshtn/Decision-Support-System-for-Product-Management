import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles } from 'lucide-react';
import AlertBadge from '../components/ui/AlertBadge';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import Loader from '../components/ui/Loader';
import { analyzeReview, getProducts, getReviewsByProduct } from '../services/dssService';

const MotionReviewCard = motion.article;

function clampScore(value) {
  return Math.max(0, Math.min(10, Number(value || 0)));
}

function buildScoreCard(product) {
  const specs = product?.rawSpecs || {};
  const battery = clampScore((Number(specs.batteryCapacity || 0) / 5500) * 10);
  const camera = clampScore((Number(specs.cameraMp || 0) / 200) * 10);
  const performance = clampScore((Number(specs.ram || 0) / 16) * 7 + (Number(specs.refreshRate || 0) / 165) * 3);
  const display = clampScore((Number(product?.screenSize || 0) / 7) * 6 + (Number(specs.refreshRate || 0) / 165) * 4);
  const value = clampScore((80000 / Math.max(15000, Number(product?.price || 50000))) * 6 + (Number(specs.ram || 0) / 16) * 4);
  const overall = clampScore((battery + camera + performance + display + value) / 5);

  return {
    battery: Number(battery.toFixed(1)),
    camera: Number(camera.toFixed(1)),
    performance: Number(performance.toFixed(1)),
    display: Number(display.toFixed(1)),
    value: Number(value.toFixed(1)),
    overall: Number(overall.toFixed(1))
  };
}

function generateFallbackReviews(product) {
  const score = buildScoreCard(product);
  const title = `${product?.brand || ''} ${product?.model || ''}`.trim();
  const batteryMood = score.battery >= 7 ? 'strong' : 'average';
  const cameraMood = score.camera >= 7 ? 'excellent' : 'decent';
  const perfMood = score.performance >= 7 ? 'smooth' : 'okay';

  return [
    {
      _id: 'generated-1',
      userName: 'AI Customer Voice',
      rating: Math.max(3, Math.min(5, Math.round(score.overall / 2))),
      reviewText: `${title} offers ${batteryMood} battery life and feels ${perfMood} for daily multitasking. The display is clean and readable outdoors.`,
      sentimentLabel: score.overall >= 7 ? 'positive' : 'neutral',
      generated: true
    },
    {
      _id: 'generated-2',
      userName: 'AI Market Snapshot',
      rating: Math.max(3, Math.min(5, Math.round((score.camera + score.display) / 4))),
      reviewText: `Camera quality is ${cameraMood} in daylight, and the device handles social media plus streaming very well for its segment.`,
      sentimentLabel: score.camera >= 7 ? 'positive' : 'neutral',
      generated: true
    },
    {
      _id: 'generated-3',
      userName: 'AI Usage Insight',
      rating: Math.max(3, Math.min(5, Math.round((score.value + score.performance) / 4))),
      reviewText: `Value-for-money is competitive, and overall experience stays reliable unless pushed with long heavy gaming sessions.`,
      sentimentLabel: score.value >= 7 ? 'positive' : 'neutral',
      generated: true
    }
  ];
}

function sentimentCounts(reviews = []) {
  const result = { positive: 0, neutral: 0, negative: 0 };

  const fromRating = (rating) => {
    const value = Number(rating);
    if (!Number.isFinite(value)) return 'neutral';
    if (value >= 4) return 'positive';
    if (value <= 2.5) return 'negative';
    return 'neutral';
  };

  reviews.forEach((review) => {
    const label = String(
      review?.analysis?.label ||
      review?.sentiment?.label ||
      review?.sentimentLabel ||
      fromRating(review?.rating)
    ).toLowerCase();
    if (label && result[label] !== undefined) result[label] += 1;
  });
  return result;
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReviewId, setLoadingReviewId] = useState(null);
  const [reviewsAreGenerated, setReviewsAreGenerated] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [products, productReviews] = await Promise.all([getProducts(), getReviewsByProduct(id)]);
        const matchedProduct = products.find((item) => item._id === id) || null;
        setProduct(matchedProduct);

        const cleanedReviews = productReviews || [];
        if (cleanedReviews.length) {
          setReviews(cleanedReviews);
          setReviewsAreGenerated(false);
        } else if (matchedProduct) {
          setReviews(generateFallbackReviews(matchedProduct));
          setReviewsAreGenerated(true);
        } else {
          setReviews([]);
          setReviewsAreGenerated(false);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const summary = useMemo(() => sentimentCounts(reviews), [reviews]);
  const scoreCard = useMemo(() => buildScoreCard(product), [product]);

  const specsGrid = useMemo(() => ([
    ['RAM', `${product?.rawSpecs?.ram || 'N/A'} GB`],
    ['Storage', `${product?.rawSpecs?.storage || 'N/A'} GB`],
    ['Battery', `${product?.rawSpecs?.batteryCapacity || 'N/A'} mAh`],
    ['Rear Camera', `${product?.rawSpecs?.cameraMp || 'N/A'} MP`],
    ['Front Camera', `${product?.rawSpecs?.frontCameraMp || 'N/A'} MP`],
    ['Refresh Rate', `${product?.rawSpecs?.refreshRate || 'N/A'} Hz`],
    ['Chipset', product?.rawSpecs?.chipset || 'N/A'],
    ['Fast Charging', `${product?.rawSpecs?.fastCharging || 'N/A'} W`]
  ]), [product]);

  const runAnalysis = async (review) => {
    const key = review?._id || review?.reviewText;
    setLoadingReviewId(key);
    try {
      const payload = review?.generated
        ? {
            reviewText: review.reviewText,
            productId: id,
            userName: review.userName || 'AI User',
            rating: review.rating
          }
        : review._id;

      const prediction = await analyzeReview(payload);
      setLatestPrediction(prediction);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingReviewId(null);
    }
  };

  if (loading) return <Loader label="Loading product details..." />;
  if (!product) return <p className="text-slate-600 dark:text-slate-300">Product not found.</p>;

  return (
    <div className="space-y-6">
      <GlassCard className="overflow-hidden p-0">
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{product.brand} {product.model}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Release: {product.releaseYear || 'N/A'} • OS: {product.operatingSystem || 'N/A'}
            </p>
            <p className="mt-3 text-xl font-semibold text-indigo-700 dark:text-indigo-300">
              INR {Number(product.price || 0).toLocaleString()}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-indigo-300/50 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-700 dark:border-indigo-700/70 dark:bg-indigo-900/25 dark:text-indigo-300">
              <span className="font-semibold">Overall Product Score:</span>
              <span className="text-base font-bold">{scoreCard.overall}/10</span>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-400/15 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Sentiment Breakdown</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <AlertBadge type="positive">Positive {summary.positive}</AlertBadge>
              <AlertBadge type="neutral">Neutral {summary.neutral}</AlertBadge>
              <AlertBadge type="negative">Negative {summary.negative}</AlertBadge>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Specifications and Scores</h3>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-slate-300/50 bg-white/60 p-3 text-center dark:border-slate-700/70 dark:bg-slate-900/55">
            <p className="text-xs text-slate-500 dark:text-slate-400">Battery</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{scoreCard.battery}/10</p>
          </div>
          <div className="rounded-xl border border-slate-300/50 bg-white/60 p-3 text-center dark:border-slate-700/70 dark:bg-slate-900/55">
            <p className="text-xs text-slate-500 dark:text-slate-400">Camera</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{scoreCard.camera}/10</p>
          </div>
          <div className="rounded-xl border border-slate-300/50 bg-white/60 p-3 text-center dark:border-slate-700/70 dark:bg-slate-900/55">
            <p className="text-xs text-slate-500 dark:text-slate-400">Performance</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{scoreCard.performance}/10</p>
          </div>
          <div className="rounded-xl border border-slate-300/50 bg-white/60 p-3 text-center dark:border-slate-700/70 dark:bg-slate-900/55">
            <p className="text-xs text-slate-500 dark:text-slate-400">Display</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{scoreCard.display}/10</p>
          </div>
          <div className="rounded-xl border border-slate-300/50 bg-white/60 p-3 text-center dark:border-slate-700/70 dark:bg-slate-900/55">
            <p className="text-xs text-slate-500 dark:text-slate-400">Value</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{scoreCard.value}/10</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {specsGrid.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-300/50 bg-white/60 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-900/55">
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Insights</h3>
          <Sparkles size={18} className="text-cyan-500" />
        </div>
        {latestPrediction ? (
          <div className="rounded-2xl border border-slate-300/50 bg-white/60 p-4 dark:border-slate-700/70 dark:bg-slate-900/55">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Sentiment: <span className="font-semibold uppercase">{latestPrediction.label}</span>
              {' '}with {((latestPrediction.confidence || 0) * 100).toFixed(1)}% confidence
            </p>
            {latestPrediction.reason ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{latestPrediction.reason}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">Analyze a review below to populate this AI insight panel.</p>
        )}
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          <MessageCircle size={18} /> Review List
        </h3>
        {reviewsAreGenerated ? (
          <p className="mb-3 rounded-xl border border-cyan-300/50 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-700 dark:border-cyan-700/70 dark:bg-cyan-900/25 dark:text-cyan-300">
            No stored reviews found for this product. Showing AI-generated sample reviews based on specs.
          </p>
        ) : null}
        <div className="space-y-3">
          {reviews.map((review, index) => (
            <MotionReviewCard
              key={review._id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.16) }}
              className="rounded-2xl border border-slate-300/50 bg-white/70 p-4 dark:border-slate-700/70 dark:bg-slate-900/55"
            >
              <p className="text-sm text-slate-700 dark:text-slate-200">{review.reviewText}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">{review.userName || 'Anonymous'}</span>
                <GradientButton
                  className="px-3 py-1.5 text-xs"
                  disabled={loadingReviewId === (review._id || review.reviewText)}
                  onClick={() => runAnalysis(review)}
                >
                  {loadingReviewId === (review._id || review.reviewText) ? 'Analyzing...' : 'Analyze Review'}
                </GradientButton>
              </div>
            </MotionReviewCard>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
