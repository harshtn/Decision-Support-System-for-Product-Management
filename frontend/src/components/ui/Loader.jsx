import { motion } from 'framer-motion';

const MotionSpinner = motion.div;

export default function Loader({ label = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <MotionSpinner
        className="h-12 w-12 rounded-full border-4 border-indigo-400/40 border-t-indigo-500"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      />
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
