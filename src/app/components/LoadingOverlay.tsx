import { motion } from 'framer-motion';

export default function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
        <p className="text-zinc-600 animate-pulse">Loading...</p>
      </div>
    </motion.div>
  );
}