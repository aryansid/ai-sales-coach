"use client";

import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import WelcomeCard from '@/components/WelcomeCard';
import LoadingCreatingPersonas from '@/components/LoadingCreatingPersonas';

const DynamicScene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center overflow-visible">
      <div className="animate-pulse text-violet-400">Loading...</div>
    </div>
  )
});

export default function Welcome() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleWelcomeSubmit = async (data: { company: string; services: string }) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'create_persona', data }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }

      console.log("responseData", responseData);

      // Store company info
      localStorage.setItem('companyInfo', JSON.stringify({
        name: data.company,
        services: data.services
      }));

      // Store raw persona data from API
      responseData.personas.forEach((persona: any, index: number) => {
        localStorage.setItem(`persona${index + 1}`, JSON.stringify(persona));
      });

      // Navigate to personas dashboard
      router.push('/personas');
      
    } catch (error) {
      console.error('Error details:', error);
    } finally {
      setIsLoading(false);
    }
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
                <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl tracking-tight text-zinc-900">
                  Sales Trainer
                </h1>
              </div>
              <p className="text-zinc-500 text-base md:text-lg ml-3 md:ml-6 flex items-center gap-2">
                Create your personalized training experience
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-violet-400" />
              </p>
            </div>
          </motion.div>

          <WelcomeCard onSubmit={handleWelcomeSubmit} />
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
                    <DynamicScene 
                      isActive={false}
                      color={3}
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