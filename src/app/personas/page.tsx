"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import LoadingCreatingPersonas from '../components/LoadingCreatingPersonas';
import WaveformBars from '../components/WaveformBars';

// Import WaveformBars and personaTemplates
import { personaTemplates } from '@/app/lib/constants';  

const Scene = dynamic(() => import('@/app/components/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center overflow-visible">
      <div className="animate-pulse text-violet-400">Loading...</div>
    </div>
  )
});

export default function PersonasDashboard() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [personas, setPersonas] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Load and map personas from localStorage
    const existingPersonas = [];
    for (let i = 1; i <= 3; i++) {
      try {
        const persona = localStorage.getItem(`persona${i}`);
        if (persona) {
          const rawPersona = JSON.parse(persona);
          existingPersonas.push({
            ...rawPersona,
            id: i - 1,
            name: rawPersona.demographics?.name || 'Unknown',
            description: rawPersona.experiences?.core_values?.join(' • ') || '',
            ...personaTemplates[i - 1]
          });
        }
      } catch (error) {
        console.error(`Error parsing persona${i}:`, error);
        // Optionally redirect to home if data is corrupted
        router.push('/');
        return;
      }
    }

    if (existingPersonas.length === 0) {
      router.push('/');
    } else {
      setPersonas(existingPersonas);
    }
  }, [router]);

  const handleCardClick = (id: number) => {
    setIsLoading(true);
    router.push(`/training/persona${id + 1}`);
  };

  const getActiveAccentColor = () => {
    const activePersona = personas.find(p => p.id === hoveredCard);
    return activePersona ? activePersona.colorId : 3;
  };

  return (
    <div className="min-h-screen overflow-hidden font-sans relative">
      {isLoading && <LoadingCreatingPersonas />}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/80" />
      <div className="absolute inset-0">
        <div className="absolute top-0 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-violet-100/20 via-blue-100/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-amber-100/20 via-purple-100/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative min-h-screen flex flex-col lg:flex-row max-w-7xl mx-auto">
        <div className="w-full lg:w-1/2 p-4 md:p-8 lg:p-12 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 lg:mb-12"
            onHoverStart={() => setIsHeaderHovered(true)}
            onHoverEnd={() => setIsHeaderHovered(false)}
          >
            <div className="inline-block">
              <div className="flex items-center gap-3 mb-3">
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
                  className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gradient-to-r from-violet-400 to-blue-400"
                />
                <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl tracking-tight text-zinc-900 relative group">
                  Sales Trainer
                  <motion.div 
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-400/50 to-blue-400/50"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isHeaderHovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </h1>
              </div>
              <p className="text-zinc-500 text-base md:text-lg ml-3 md:ml-6 flex items-center gap-2">
                Hop on a call with your personas to begin training
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-violet-400" />
              </p>
            </div>
          </motion.div>

          <div className="flex flex-col gap-3">
            {personas.map((persona, index) => (
              <div 
                key={persona.id} 
                onClick={() => handleCardClick(index)}
                className="block w-full no-underline cursor-pointer"
              >
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
                    relative h-[70px] md:h-[90px] lg:h-[100px] p-3 md:p-6
                    rounded-lg md:rounded-xl
                    bg-gradient-to-r ${persona.gradient}
                    hover:bg-gradient-to-r ${persona.hover}
                    backdrop-blur-xl
                    border ${persona.border}
                    group
                    flex items-center justify-between
                    hover:shadow-lg
                    will-change-transform
                    cursor-pointer
                  `}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <motion.div 
                      className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${persona.dot}`}
                      animate={{
                        scale: hoveredCard === persona.id ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        duration: 1,
                        repeat: hoveredCard === persona.id ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    />
                    <div>
                      <h2 className="font-serif text-lg md:text-xl lg:text-2xl text-zinc-900 mb-0.5">
                        {persona.name}
                      </h2>
                      <p className="text-zinc-600 text-xs md:text-sm">
                        {persona.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <WaveformBars 
                      isActive={hoveredCard === persona.id} 
                      color={persona.accent}
                      numBars={8}
                    />
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-1/2 h-[300px] md:h-[400px] lg:h-auto relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="transform-gpu">
              <div className="p-8 md:p-12 lg:p-16">
                <div className="w-[200px] h-[200px] md:w-[300px] md:h-[300px] lg:w-[400px] lg:h-[400px] relative flex flex-col items-center">
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