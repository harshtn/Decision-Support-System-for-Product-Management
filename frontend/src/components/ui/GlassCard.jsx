import { motion } from 'framer-motion';

const MotionSection = motion.section;

export default function GlassCard({ children, className = '', delay = 0 }) {
  return (
    <MotionSection
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: 'easeOut', delay }}
      className={`glass-card rounded-2xl ${className}`}
    >
      {children}
    </MotionSection>
  );
}
