"use client";

import { motion } from 'framer-motion';
import { useState } from 'react';

interface WelcomeCardProps {
  onSubmit: (data: { company: string; services: string }) => void;
}

export function WelcomeCard({ onSubmit }: WelcomeCardProps) {
  const [company, setCompany] = useState('');
  const [services, setServices] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative backdrop-blur-xl rounded-xl border border-zinc-200/20 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-100/30 via-white/50 to-blue-100/30" />
        
        <div className="relative p-6 md:p-8">
          <div className="mb-6">
            <h2 className="font-serif text-2xl md:text-3xl text-zinc-900 mb-2">Welcome!</h2>
            <p className="text-zinc-500">
              Tell us about your insurance company to get started.
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2 ml-1">
                Company Name
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/50 border border-zinc-200 
                         focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 
                         outline-none transition-all"
                placeholder="Enter your company name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2 ml-1">
                Services Offered
              </label>
              <textarea
                value={services}
                onChange={(e) => setServices(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/50 border border-zinc-200 
                         focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 
                         outline-none transition-all min-h-[120px]"
                placeholder="Describe your insurance services..."
              />
            </div>

            <button
              onClick={() => onSubmit({ company, services })}
              disabled={!company || !services}
              className="w-full bg-gradient-to-r from-violet-500 to-blue-500 
                       hover:from-violet-600 hover:to-blue-600 text-white 
                       rounded-lg px-6 py-3.5 font-medium 
                       disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-all shadow-lg shadow-violet-500/25
                       hover:shadow-xl hover:shadow-violet-500/30"
            >
              Continue to Training
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}