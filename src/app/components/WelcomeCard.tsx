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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 md:p-8"
      >
        <h2 className="font-serif text-2xl md:text-3xl text-zinc-900 mb-2">Welcome!</h2>
        <p className="text-zinc-500 mb-6">Tell us about your insurance company to get started.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition-all"
              placeholder="Enter your company name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Services Offered
            </label>
            <textarea
              value={services}
              onChange={(e) => setServices(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition-all min-h-[100px]"
              placeholder="Describe your insurance services..."
            />
          </div>

          <button
            onClick={() => onSubmit({ company, services })}
            disabled={!company || !services}
            className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-lg px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Continue to Training
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}