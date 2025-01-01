"use client";

import { motion } from 'framer-motion';
import { useState } from 'react';

interface WelcomeCardProps {
  onSubmit: (data: { industry: string; services: string }) => void;
}

const WelcomeCard = ({ onSubmit }: WelcomeCardProps) => {
  const [industry, setIndustry] = useState('');
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
              Tell us about your company to get started.
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2 ml-1">
                Industry
              </label>
              <div className="relative">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/50 border border-zinc-200 
                           focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 
                           outline-none transition-all text-black appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select your industry</option>
                  <option value="insurance">Insurance</option>
                  <option value="healthcare">Healthcare</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
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
                         outline-none transition-all min-h-[120px] text-black"
                placeholder="Describe your insurance services..."
              />
            </div>

            <button
              onClick={() => onSubmit({ industry, services })}
              disabled={!industry || !services}
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
};

export default WelcomeCard;