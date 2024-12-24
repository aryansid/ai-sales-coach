import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone } from 'lucide-react';

export const ConnectingOverlay = ({ isVisible }: { isVisible: boolean }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="flex flex-col items-center gap-6 p-8 rounded-2xl">
            <div className="flex flex-col items-center gap-6">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="p-4 rounded-full bg-violet-100"
              >
                <Phone className="w-8 h-8 text-violet-500" />
              </motion.div>
              <motion.div 
                className="flex gap-1.5"
                animate="animate"
                variants={{
                  animate: {
                    transition: {
                      staggerChildren: 0.2
                    }
                  }
                }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-violet-500"
                    variants={{
                      animate: {
                        y: ["0%", "-50%", "0%"]
                      }
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>
            </div>
            <p className="text-zinc-600 font-medium text-lg text-center">
            Calling potential client...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectingOverlay;