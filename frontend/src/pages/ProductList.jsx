import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import SkeletonCard from '../components/ui/SkeletonCard';
import GradientButton from '../components/ui/GradientButton';
import { getProducts } from '../services/dssService';

const MotionCard = motion.div;

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (query = '') => {
    setLoading(true);
    try {
      const data = await getProducts(query);
      setProducts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <section className="glass-card rounded-2xl p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              className="w-full rounded-2xl border border-slate-300/60 bg-white/70 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product model or brand"
            />
          </div>
          <GradientButton onClick={() => load(search)} className="md:min-w-40">Search Products</GradientButton>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
        ) : (
          products.map((product, index) => (
            <MotionCard
              key={product._id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.22) }}
            >
              <Link
                to={`/products/${product._id}`}
                className="group block rounded-2xl border border-slate-200/60 bg-white/65 p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-glow dark:border-slate-700/70 dark:bg-slate-900/60"
              >
                <div className="mb-4 flex h-40 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 via-blue-500/20 to-cyan-400/20">
                  <img
                    src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop"
                    alt="Smartphone"
                    className="h-28 w-28 rounded-2xl object-cover opacity-90 transition duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {product.brand} {product.model}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">OS: {product.operatingSystem || 'N/A'}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    INR {Number(product.price || 0).toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <Star size={12} /> 4.2
                  </span>
                </div>
              </Link>
            </MotionCard>
          ))
        )}
      </section>
    </div>
  );
}
