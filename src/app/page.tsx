"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';


// Updated WaveformBars component
const WaveformBars = ({ isActive, color, numBars = 12 }: { isActive: boolean, color: string, numBars: number }) => {
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

// New Dynamic Particles component
const DynamicParticles = ({ isActive, accentColor }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    // Set dimensions on client-side only
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const particleCount = dimensions.width < 768 ? 15 : 30;
  const particles = Array(particleCount).fill(null);
  const containerSize = dimensions.width < 768 ? 300 : 700;
  
  return (
    <div className="relative w-full h-full">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: accentColor,
            opacity: 0.6,
          }}
          initial={{
            x: Math.random() * containerSize,
            y: Math.random() * containerSize,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            x: Math.random() * containerSize,
            y: Math.random() * containerSize,
            scale: isActive ? [1, 1.5, 1] : 1,
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
        }}
        animate={{
          scale: isActive ? [1, 1.1, 1] : 1,
          opacity: isActive ? [0.3, 0.6, 0.3] : 0.3,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

// Update Scene import to use dynamic loading with SSR disabled
const Scene = dynamic(() => import('@/app/components/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center overflow-visible">
      <div className="animate-pulse text-violet-400">Loading...</div>
    </div>
  )
});

const personas = [
  {
    id: 'artist',
    name: 'The Artist',
    description: 'Creative, design-focused buyers',
    gradient: 'from-violet-400/20 via-purple-400/10 to-fuchsia-400/20',
    hover: 'hover:from-violet-400/30 hover:to-fuchsia-400/30',
    border: 'border-violet-300/20',
    dot: 'bg-violet-400',
    accent: '#8B5CF6'
  },
  {
    id: 'lifestyle',
    name: 'The Lifestyle Owner',
    description: 'Status-conscious luxury buyers',
    gradient: 'from-blue-400/20 via-cyan-400/10 to-sky-400/20',
    hover: 'hover:from-blue-400/30 hover:to-sky-400/30',
    border: 'border-blue-300/20',
    dot: 'bg-blue-400',
    accent: '#3B82F6'
  },
  {
    id: 'laggard',
    name: 'The Laggard Buyer',
    description: 'Traditional solution adopters',
    gradient: 'from-amber-400/20 via-orange-400/10 to-yellow-400/20',
    hover: 'hover:from-amber-400/30 hover:to-yellow-400/30',
    border: 'border-amber-300/20',
    dot: 'bg-amber-400',
    accent: '#F59E0B'
  }
];

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  // Add this helper function
  const getActiveAccentColor = () => {
    const activePersona = personas.find(p => p.id === hoveredCard);
    return activePersona ? activePersona.accent : '#8B5CF6';
  };

  return (
    <div className="min-h-screen overflow-hidden font-sans relative">
      {/* Background gradients (unchanged) */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/80" />
      <div className="absolute inset-0">
        <div className="absolute top-0 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-violet-100/20 via-blue-100/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-amber-100/20 via-purple-100/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left side - Content */}
        <div className="w-full lg:w-[45%] p-6 md:p-12 lg:p-16 flex flex-col">
          {/* Title section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 lg:mb-16"
            onHoverStart={() => setIsHeaderHovered(true)}
            onHoverEnd={() => setIsHeaderHovered(false)}
          >
            <div className="inline-block">
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-4 h-4 rounded-full bg-gradient-to-r from-violet-400 to-blue-400"
                />
                <h1 className="font-serif text-4xl md:text-6xl lg:text-8xl tracking-tight text-zinc-900 relative group">
                  Voice Coach
                  <motion.div 
                    className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-400/50 to-blue-400/50"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isHeaderHovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </h1>
              </div>
              <p className="text-zinc-500 text-lg md:text-xl ml-4 md:ml-8 flex items-center gap-2">
                Select persona to begin training
                <Sparkles className="w-4 h-4 text-violet-400" />
              </p>
            </div>
          </motion.div>

          {/* Persona Cards */}
          <div className="flex flex-col gap-3 md:gap-4">
            {personas.map((persona, index) => (
              <Link href={`/training/${persona.id}`} key={persona.id} className="block">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  onHoverStart={() => setHoveredCard(persona.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  whileHover={{ x: 8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative h-[90px] md:h-[120px] p-4 md:p-8 rounded-xl md:rounded-2xl
                    bg-gradient-to-r ${persona.gradient}
                    hover:bg-gradient-to-r ${persona.hover}
                    backdrop-blur-xl
                    border ${persona.border}
                    group
                    flex items-center justify-between
                    hover:shadow-lg
                    will-change-transform
                  `}
                  style={{
                    transition: 'background 0.2s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out'
                  }}
                >
                  <div className="flex items-center gap-2 md:gap-4">
                    <motion.div 
                      className={`w-3 h-3 rounded-full ${persona.dot}`}
                      animate={{
                        scale: hoveredCard === persona.id ? [1, 1.2, 1] : 1
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <div>
                      <h2 className="font-serif text-xl md:text-2xl text-zinc-900 mb-0.5 md:mb-1">
                        {persona.name}
                      </h2>
                      <p className="text-zinc-600 text-xs md:text-sm mb-1 md:mb-2">
                        {persona.description}
                      </p>
                      <WaveformBars 
                        isActive={hoveredCard === persona.id} 
                        color={persona.accent}
                      />
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: hoveredCard === persona.id ? 1 : 0, 
                      x: hoveredCard === persona.id ? 0 : -10,
                      scale: hoveredCard === persona.id ? [1, 1.1, 1] : 1
                    }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    <ArrowRight 
                      className="w-6 h-6 text-zinc-800"
                      style={{ color: persona.accent }}
                    />
                  </motion.div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right side - Enhanced Visualizer */}
        <div className="w-full lg:w-[55%] h-[400px] md:h-[500px] lg:h-auto relative flex items-center justify-center">
          <div className="absolute inset-[-50px] flex items-center justify-center">
            <div className="transform-gpu">
              <div className="p-16 md:p-24 lg:p-32">
                <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] lg:w-[600px] lg:h-[600px] relative">
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-pulse text-violet-400">Loading...</div>
                    </div>
                  }>
                    <Scene 
                      isActive={hoveredCard !== null}
                      color={getActiveAccentColor()}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}