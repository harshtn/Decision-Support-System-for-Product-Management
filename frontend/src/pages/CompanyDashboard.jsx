import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Upload, RefreshCcw, Wrench } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import AlertBadge from '../components/ui/AlertBadge';
import Loader from '../components/ui/Loader';
import {
  analyzeProduct,
  getDssInsights,
  getOverview,
  getProducts,
  uploadDatasets
} from '../services/dssService';

const MotionSection = motion.section;

export default function CompanyDashboard() {
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [threshold, setThreshold] = useState(0.35);
  const [analyzeLimit, setAnalyzeLimit] = useState(100);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [reviewsFile, setReviewsFile] = useState(null);
  const [productsFile, setProductsFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [generateFreshReviews, setGenerateFreshReviews] = useState(true);
  const [generateCount, setGenerateCount] = useState(20);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [thresholdResult, setThresholdResult] = useState(null);
  const [actionError, setActionError] = useState('');

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewData, productData, dssData] = await Promise.all([
        getOverview(),
        getProducts(),
        getDssInsights(threshold)
      ]);

      setOverview({ ...overviewData, dss: dssData });
      setProducts(productData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const handleUpload = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    if (reviewsFile) formData.append('reviews', reviewsFile);
    if (productsFile) formData.append('products', productsFile);
    formData.append('analyzeOnUpload', 'true');
    formData.append('analyzeLimit', String(analyzeLimit));

    setBusy(true);
    setUploadError('');
    setUploadResult(null);
    try {
      const result = await uploadDatasets(formData);
      setUploadResult(result);
      await refreshDashboard();
      setReviewsFile(null);
      setProductsFile(null);
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || error?.message || 'Upload failed. Please check your CSV files and try again.';
      setUploadError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleProductAnalyze = async () => {
    if (!selectedProductId) return;
    setBusy(true);
    setActionError('');
    setAnalysisResult(null);
    try {
      const result = await analyzeProduct(selectedProductId, analyzeLimit, {
        generateReviews: generateFreshReviews,
        generateCount
      });
      setAnalysisResult(result);
      await refreshDashboard();
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || error?.message || 'Product analysis failed.';
      setActionError(message);
    } finally {
      setBusy(false);
    }
  };

  const applyThreshold = async () => {
    setBusy(true);
    setActionError('');
    try {
      const dss = await getDssInsights(threshold);
      setOverview((prev) => ({ ...(prev || {}), dss }));
      setThresholdResult({
        threshold,
        alerts: dss?.negativeAlerts?.length || 0,
        issues: dss?.topIssues?.length || 0,
        recommendations: dss?.recommendations?.length || 0
      });
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || error?.message || 'Threshold update failed.';
      setActionError(message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading company dashboard..." />;

  return (
    <div className="space-y-6">
      <MotionSection
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <GlassCard className="p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Products</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{overview?.productCount || 0}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Reviews</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{overview?.reviewCount || 0}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">AI Analyses</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{overview?.sentimentCount || 0}</p>
        </GlassCard>
      </MotionSection>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <Upload size={18} /> Upload and Analyze Datasets
          </h3>
          <form className="space-y-4" onSubmit={handleUpload}>
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Reviews CSV
              <input
                type="file"
                accept=".csv"
                className="mt-1 block w-full rounded-xl border border-slate-300/60 bg-white/70 p-2 text-sm dark:border-slate-700 dark:bg-slate-900/60"
                onChange={(event) => setReviewsFile(event.target.files?.[0] || null)}
              />
            </label>

            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Products CSV
              <input
                type="file"
                accept=".csv"
                className="mt-1 block w-full rounded-xl border border-slate-300/60 bg-white/70 p-2 text-sm dark:border-slate-700 dark:bg-slate-900/60"
                onChange={(event) => setProductsFile(event.target.files?.[0] || null)}
              />
            </label>

            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Analyze limit
              <input
                type="number"
                min="1"
                max="1000"
                value={analyzeLimit}
                onChange={(event) => setAnalyzeLimit(Number(event.target.value || 100))}
                className="mt-1 block w-full rounded-xl border border-slate-300/60 bg-white/70 p-2 text-sm dark:border-slate-700 dark:bg-slate-900/60"
              />
            </label>

            <GradientButton type="submit" className="w-full" disabled={busy}>
              {busy ? 'Processing...' : 'Upload + Run Analysis'}
            </GradientButton>

            {uploadError ? (
              <div className="rounded-xl border border-rose-300/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/70 dark:bg-rose-900/20 dark:text-rose-300">
                {uploadError}
              </div>
            ) : null}

            {uploadResult ? (
              <div className="space-y-2 rounded-xl border border-emerald-300/50 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-900/20 dark:text-emerald-300">
                <p className="font-semibold">Upload Result: {uploadResult.message || 'Completed'}</p>
                <p>Source: {uploadResult.source || 'uploaded-files'}</p>
                <p>Products inserted: {uploadResult.products ?? 0}</p>
                <p>Reviews inserted: {uploadResult.reviews ?? 0}</p>
                <p>Analyses completed: {uploadResult.analyzed ?? 0}</p>
                <p>Analyses failed: {uploadResult.failedAnalyses ?? 0}</p>
                {(uploadResult.failedAnalyses || 0) > 0 ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Some analyses failed, often due to AI API quota or rate limits. Data is still uploaded and visible in dashboard.
                  </p>
                ) : null}
              </div>
            ) : null}
          </form>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <RefreshCcw size={18} /> Product and Threshold Controls
          </h3>

          <div className="space-y-4">
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Product
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-300/60 bg-white/70 p-2 text-sm dark:border-slate-700 dark:bg-slate-900/60"
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>{product.productTitle || `${product.brand} ${product.model}`}</option>
                ))}
              </select>
            </label>

            <GradientButton type="button" className="w-full" onClick={handleProductAnalyze} disabled={busy || !selectedProductId}>
              Analyze Existing Product Reviews
            </GradientButton>

            <label className="flex items-center gap-2 rounded-xl border border-slate-300/50 bg-white/60 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <input
                type="checkbox"
                checked={generateFreshReviews}
                onChange={(event) => setGenerateFreshReviews(event.target.checked)}
              />
              Generate fresh realistic reviews on each run
            </label>

            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Fresh reviews per run
              <input
                type="number"
                min="1"
                max="50"
                value={generateCount}
                onChange={(event) => setGenerateCount(Number(event.target.value || 20))}
                className="mt-1 block w-full rounded-xl border border-slate-300/60 bg-white/70 p-2 text-sm dark:border-slate-700 dark:bg-slate-900/60"
              />
            </label>

            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Negative threshold (0 - 1)
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value || 0.35))}
                className="mt-1 block w-full rounded-xl border border-slate-300/60 bg-white/70 p-2 text-sm dark:border-slate-700 dark:bg-slate-900/60"
              />
            </label>

            <button
              type="button"
              onClick={applyThreshold}
              disabled={busy}
              className="w-full rounded-2xl border border-indigo-400/50 bg-indigo-500/15 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-500/25 dark:text-indigo-300"
            >
              Apply DSS Threshold
            </button>

            {actionError ? (
              <div className="rounded-xl border border-rose-300/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/70 dark:bg-rose-900/20 dark:text-rose-300">
                {actionError}
              </div>
            ) : null}

            {analysisResult ? (
              <div className="rounded-xl border border-cyan-300/50 bg-cyan-500/10 p-3 text-sm text-cyan-700 dark:border-cyan-800/70 dark:bg-cyan-900/20 dark:text-cyan-300">
                <p className="font-semibold">Product Analysis Result</p>
                <p>Fresh reviews generated: {analysisResult.generatedReviews ?? 0}</p>
                <p>Total product reviews: {analysisResult.totalReviews ?? 0}</p>
                <p>Analyzed now: {analysisResult.analyzed ?? 0}</p>
                <p>Failed now: {analysisResult.failed ?? 0}</p>
                <p>
                  Sentiment mix: +{analysisResult?.sentimentSummary?.positive ?? 0} /
                  ~{analysisResult?.sentimentSummary?.neutral ?? 0} /
                  -{analysisResult?.sentimentSummary?.negative ?? 0}
                </p>
              </div>
            ) : null}

            {thresholdResult ? (
              <div className="rounded-xl border border-indigo-300/50 bg-indigo-500/10 p-3 text-sm text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-900/20 dark:text-indigo-300">
                <p className="font-semibold">Threshold Applied ({thresholdResult.threshold})</p>
                <p>Alerts: {thresholdResult.alerts}</p>
                <p>Top issues: {thresholdResult.issues}</p>
                <p>Recommendations: {thresholdResult.recommendations}</p>
              </div>
            ) : null}
          </div>
        </GlassCard>
      </section>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <AlertTriangle size={18} /> Negative Sentiment Alerts
          </h3>
          <AlertBadge type={(overview?.dss?.negativeAlerts || []).length ? 'negative' : 'positive'}>
            {(overview?.dss?.negativeAlerts || []).length ? 'Alerts Active' : 'No Alerts'}
          </AlertBadge>
        </div>

        {!(overview?.dss?.negativeAlerts || []).length ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">No products exceed the threshold right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {overview.dss.negativeAlerts.map((alert) => (
              <div key={alert.productId} className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 dark:border-rose-800/70 dark:bg-rose-900/20">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{alert.product}</p>
                <p className="text-sm text-rose-700 dark:text-rose-300">
                  {(alert.negativeRate * 100).toFixed(1)}% negative ({alert.negativeCount}/{alert.totalReviews})
                </p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <AlertTriangle size={18} /> Top Issues
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(overview?.dss?.topIssues || []).map((issue) => (
              <div key={issue.issue} className="rounded-2xl border border-slate-300/50 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                <p className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">{issue.issue}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Mentions: {issue.mentions}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <Wrench size={18} /> Recommended Improvements
          </h3>
          <div className="space-y-3">
            {(overview?.dss?.recommendations || []).map((item) => (
              <div key={item.issue} className="rounded-2xl border border-cyan-300/40 bg-cyan-500/10 p-3 dark:border-cyan-800/70 dark:bg-cyan-900/20">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">{item.issue}</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{item.recommendation}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
