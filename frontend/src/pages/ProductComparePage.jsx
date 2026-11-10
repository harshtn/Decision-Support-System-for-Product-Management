import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle2, Search, Scale } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import Loader from '../components/ui/Loader';
import { compareProducts, getProducts } from '../services/dssService';

const SPEC_ROWS = [
  { key: 'price', label: 'Price (INR)' },
  { key: 'releaseYear', label: 'Release Year' },
  { key: 'operatingSystem', label: 'Operating System' },
  { key: 'screenSize', label: 'Screen Size (in)' },
  { key: 'ram', label: 'RAM (GB)' },
  { key: 'storage', label: 'Storage (GB)' },
  { key: 'batteryCapacity', label: 'Battery (mAh)' },
  { key: 'cameraMp', label: 'Rear Camera (MP)' },
  { key: 'frontCameraMp', label: 'Front Camera (MP)' },
  { key: 'refreshRate', label: 'Refresh Rate (Hz)' },
  { key: 'chipset', label: 'Chipset' },
  { key: 'fastCharging', label: 'Fast Charging (W)' }
];

function displayName(product) {
  if (!product) return '';
  return product.productTitle || `${product.brand || ''} ${product.model || ''}`.trim();
}

function readSpec(product, key) {
  if (!product) return 'N/A';
  if (key in product) {
    const value = product[key];
    return value ?? value === 0 ? String(value) : 'N/A';
  }
  const rawValue = product?.rawSpecs?.[key];
  return rawValue ?? rawValue === 0 ? String(rawValue) : 'N/A';
}

function ProductSearch({ label, query, onQueryChange, options, onSelect, selectedProduct }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 text-slate-400" size={16} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by brand or model"
          className="w-full rounded-2xl border border-slate-300/60 bg-white/70 py-3 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
        />

        {options.length ? (
          <div className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-300/60 bg-white/90 p-1 shadow-soft backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
            {options.map((product) => (
              <button
                key={product._id}
                type="button"
                onClick={() => onSelect(product)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-indigo-500/10 dark:text-slate-200 dark:hover:bg-slate-800/70"
              >
                <span>{displayName(product)}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">INR {Number(product.price || 0).toLocaleString()}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {selectedProduct ? (
        <div className="rounded-xl border border-cyan-300/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-700 dark:border-cyan-800/70 dark:bg-cyan-900/25 dark:text-cyan-300">
          Selected: {displayName(selectedProduct)}
        </div>
      ) : null}
    </div>
  );
}

export default function ProductComparePage() {
  const [leftQuery, setLeftQuery] = useState('');
  const [rightQuery, setRightQuery] = useState('');
  const [leftOptions, setLeftOptions] = useState([]);
  const [rightOptions, setRightOptions] = useState([]);
  const [leftProduct, setLeftProduct] = useState(null);
  const [rightProduct, setRightProduct] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (leftQuery.trim().length < 2) {
        setLeftOptions([]);
        return;
      }
      setSearching(true);
      try {
        const list = await getProducts(leftQuery.trim());
        setLeftOptions((list || []).slice(0, 8));
      } catch (error) {
        console.error(error);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [leftQuery]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (rightQuery.trim().length < 2) {
        setRightOptions([]);
        return;
      }
      setSearching(true);
      try {
        const list = await getProducts(rightQuery.trim());
        setRightOptions((list || []).slice(0, 8));
      } catch (error) {
        console.error(error);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [rightQuery]);

  const canCompare = Boolean(leftProduct?._id && rightProduct?._id && leftProduct._id !== rightProduct._id);

  const compareNow = async () => {
    if (!canCompare) return;
    setComparing(true);
    try {
      const data = await compareProducts(leftProduct._id, rightProduct._id);
      setCompareResult(data || null);
    } catch (error) {
      console.error(error);
    } finally {
      setComparing(false);
    }
  };

  const currentLeft = compareResult?.leftProduct || leftProduct;
  const currentRight = compareResult?.rightProduct || rightProduct;

  const winnerText = useMemo(() => {
    const winner = compareResult?.ai?.winner;
    if (!winner || !currentLeft || !currentRight) return 'No winner selected yet';
    if (winner === 'left') return `${displayName(currentLeft)} has the edge`;
    if (winner === 'right') return `${displayName(currentRight)} has the edge`;
    return 'Both are closely matched';
  }, [compareResult, currentLeft, currentRight]);

  if (comparing) return <Loader label="Running AI comparison..." />;

  return (
    <div className="space-y-6">
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Scale size={18} className="text-indigo-500" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Product Search and Comparison</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ProductSearch
            label="Product A"
            query={leftQuery}
            onQueryChange={setLeftQuery}
            options={leftOptions}
            selectedProduct={leftProduct}
            onSelect={(product) => {
              setLeftProduct(product);
              setLeftQuery(displayName(product));
              setLeftOptions([]);
            }}
          />

          <ProductSearch
            label="Product B"
            query={rightQuery}
            onQueryChange={setRightQuery}
            options={rightOptions}
            selectedProduct={rightProduct}
            onSelect={(product) => {
              setRightProduct(product);
              setRightQuery(displayName(product));
              setRightOptions([]);
            }}
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <GradientButton onClick={compareNow} disabled={!canCompare || comparing}>
            Compare with AI
          </GradientButton>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {searching ? 'Searching products...' : 'Pick two products to compare specs and recommendations.'}
          </span>
        </div>
      </GlassCard>

      {currentLeft && currentRight ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-slate-200/60 bg-white/30 px-5 py-4 dark:border-slate-700/70 dark:bg-slate-900/30">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Specs Comparison</h3>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 text-left dark:border-slate-700/70">
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Specification</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{displayName(currentLeft)}</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{displayName(currentRight)}</th>
                </tr>
              </thead>
              <tbody>
                {SPEC_ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-slate-200/50 last:border-b-0 dark:border-slate-700/60">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.label}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{readSpec(currentLeft, row.key)}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{readSpec(currentRight, row.key)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : null}

      {compareResult?.ai ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          <GlassCard className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <Bot size={18} className="text-cyan-500" /> AI Comparison Summary
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-200">{compareResult.ai.summary || 'No summary returned.'}</p>
            <p className="mt-3 rounded-xl border border-indigo-300/40 bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-900/20 dark:text-indigo-300">
              {winnerText}
            </p>
            {compareResult.ai.bestFor ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Best for: {compareResult.ai.bestFor}</p>
            ) : null}
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Strengths and Trade-offs</h3>
            <div className="space-y-2">
              {(compareResult.ai.leftStrengths || []).map((item) => (
                <p key={`left-${item}`} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <CheckCircle2 size={15} className="mt-0.5 text-emerald-500" />
                  <span>{displayName(currentLeft)}: {item}</span>
                </p>
              ))}
              {(compareResult.ai.rightStrengths || []).map((item) => (
                <p key={`right-${item}`} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <CheckCircle2 size={15} className="mt-0.5 text-cyan-500" />
                  <span>{displayName(currentRight)}: {item}</span>
                </p>
              ))}
              {(compareResult.ai.tradeoffs || []).map((item) => (
                <p key={`tradeoff-${item}`} className="text-sm text-slate-600 dark:text-slate-300">
                  Trade-off: {item}
                </p>
              ))}
            </div>
          </GlassCard>
        </motion.section>
      ) : null}
    </div>
  );
}
