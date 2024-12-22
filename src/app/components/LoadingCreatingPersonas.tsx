import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function LoadingCreatingPersonas() {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    "Analyzing your company profile...",
    "Crafting unique personalities...",
    "Adding life experiences...",
    "Building detailed backgrounds..."
  ];

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Animation for the circular progress
  const circleVariants = {
    initial: {
      rotate: 0,
    },
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-8 max-w-md mx-auto p-8">
        {/* Main loading animation */}
        <div className="relative w-32 h-32">
          {/* Outer rotating circle */}
          <motion.div
            variants={circleVariants}
            initial="initial"
            animate="animate"
            className="absolute inset-0 border-4 border-violet-400/30 rounded-full"
            style={{
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
            }}
          />
          
          {/* Inner pulsing circle */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-4 bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 rounded-full"
          />
          
          {/* Center dot */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-[40%] bg-violet-400 rounded-full"
          />
        </div>

        {/* Text content */}
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-serif text-zinc-800">
            Creating Your Personas
          </h2>
          
          {/* Message container with fixed height */}
          <div className="h-6 relative">
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-zinc-600 absolute w-full text-center"
              >
                {messages[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}