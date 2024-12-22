"use client";


import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import { useRouter } from 'next/navigation';
import { WelcomeCard } from '@/app/components/WelcomeCard';
import LoadingCreatingPersonas from '@/app/components/LoadingCreatingPersonas';

// WaveformBars component remains unchanged
const WaveformBars = ({ isActive, color, numBars = 12 }: {
  isActive: boolean;
  color: string;
  numBars?: number;
}) => {
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

const Scene = dynamic(() => import('@/app/components/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center overflow-visible">
      <div className="animate-pulse text-violet-400">Loading...</div>
    </div>
  )
});

// Define the existing personas array
const existingPersonas = [
  {
    id: 'Zayne',
    name: 'The Artist',
    description: 'Creative, design-focused buyers',
    gradient: 'from-violet-400/20 via-purple-400/10 to-fuchsia-400/20',
    hover: 'hover:from-violet-400/30 hover:to-fuchsia-400/30',
    border: 'border-violet-300/20',
    dot: 'bg-violet-400',
    accent: '#8B5CF6',
    colorId: 0
  },
  {
    id: 'Isla',
    name: 'The Lifestyle Owner',
    description: 'Status-conscious luxury buyers',
    gradient: 'from-blue-400/20 via-cyan-400/10 to-sky-400/20',
    hover: 'hover:from-blue-400/30 hover:to-sky-400/30',
    border: 'border-blue-300/20',
    dot: 'bg-blue-400',
    accent: '#3B82F6',
    colorId: 1
  },
  {
    id: 'Sloane',
    name: 'The Laggard Buyer',
    description: 'Traditional solution adopters',
    gradient: 'from-amber-400/20 via-orange-400/10 to-yellow-400/20',
    hover: 'hover:from-amber-400/30 hover:to-yellow-400/30',
    border: 'border-amber-300/20',
    dot: 'bg-amber-400',
    accent: '#F59E0B',
    colorId: 2
  }
];

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcomeCard, setShowWelcomeCard] = useState(true);
  const [userInfo, setUserInfo] = useState<{ company: string; services: string } | null>(null);
  const [personas, setPersonas] = useState(existingPersonas);
  const router = useRouter();

  // Clear localStorage and reset state on page load
  useEffect(() => {
    localStorage.removeItem('userInfo');
    setShowWelcomeCard(true);
    setUserInfo(null);
  }, []); // Empty dependency array means this runs once on mount

  const handleCardClick = (personaId: string) => {
    setIsLoading(true);
    router.push(`/training/${personaId}`);
  };

  const handleWelcomeSubmit = async (data: { company: string; services: string }) => {
    setUserInfo(data);
    setShowWelcomeCard(false);
    setIsLoading(true);

    try {
      console.log('Sending request with data:', data);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'create_persona', data }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Server error:', responseData);
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }

      console.log('Server response:', responseData);
      const personasData = responseData;
      console.log('Generated Personas:', personasData);
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
      setShowWelcomeCard(false);
    }
  }, []);

  const getActiveAccentColor = () => {
    const activePersona = personas.find(p => p.id === hoveredCard);
    return activePersona ? activePersona.colorId : 3;
  };

  return (
    <>
      {showWelcomeCard && <WelcomeCard onSubmit={handleWelcomeSubmit} />}
      {isLoading && <LoadingCreatingPersonas />}
      <div className="min-h-screen overflow-hidden font-sans relative">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/80" />
        <div className="absolute inset-0">
          <div className="absolute top-0 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-violet-100/20 via-blue-100/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-amber-100/20 via-purple-100/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative min-h-screen flex flex-col lg:flex-row max-w-7xl mx-auto">
          {/* Left side - Content */}
          <div className="w-full lg:w-1/2 p-4 md:p-8 lg:p-12 flex flex-col">
            {/* Title section */}
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

            {/* Persona Cards */}
            <div className="flex flex-col gap-3">
              {personas.map((persona, index) => (
                <div 
                  key={persona.id} 
                  onClick={() => handleCardClick(persona.id)}
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
                    style={{
                      transition: 'background 0.2s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out'
                    }}
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

          {/* Right side - Enhanced Visualizer */}
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
                    
                    <AnimatePresence mode="wait">
                      {hoveredCard && (
                        <motion.div
                          key={hoveredCard}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ 
                            duration: 0.5,
                            ease: "easeOut"
                          }}
                          className="mt-8 text-center relative"
                        >
                          <div className="relative">                            
                            <motion.div
                              className="relative overflow-hidden flex justify-center items-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <motion.span 
                                className="block text-2xl md:text-3xl lg:text-4xl font-bold"
                                style={{ 
                                  background: `linear-gradient(to right, ${personas.find(p => p.id === hoveredCard)?.accent}, ${personas.find(p => p.id === hoveredCard)?.accent}88)`,
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  fontFamily: '"Cal Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                }}
                              >
                                Meet {personas.find(p => p.id === hoveredCard)?.id}
                              </motion.span>
                            </motion.div>

                            <motion.div 
                              className="h-0.5 mt-2 rounded-full mx-auto"
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              exit={{ width: 0 }}
                              style={{
                                background: `linear-gradient(to right, ${personas.find(p => p.id === hoveredCard)?.accent}33, ${personas.find(p => p.id === hoveredCard)?.accent}, ${personas.find(p => p.id === hoveredCard)?.accent}33)`
                              }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}