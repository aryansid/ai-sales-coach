"use client";

import { motion } from 'framer-motion';

interface WaveformBarsProps {
  isActive: boolean;
  color: string;
  numBars?: number;
}

const WaveformBars = ({ isActive, color, numBars = 12 }: WaveformBarsProps) => {
  const baseHeights = [60, 40, 80, 30, 70, 40, 90, 50, 75, 35, 65, 45];
  
  return (
    <div className="flex items-center gap-[1px] md:gap-[2px] h-4 md:h-6">
      {[...Array(numBars)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ height: `${baseHeights[i]}%` }}
          animate={isActive ? {
            height: [
              `${baseHeights[i]}%`,
              `${Math.random() * 100}%`,
              `${baseHeights[i]}%`
            ],
          } : { height: `${baseHeights[i]}%` }}
          transition={{
            duration: 0.5,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.05,
          }}
          style={{ 
            backgroundColor: color,
            opacity: isActive ? 1 : 0.7,
            width: '2px'
          }}
          className="rounded-full md:w-[3px]"
        />
      ))}
    </div>
  );
};

export default WaveformBars;