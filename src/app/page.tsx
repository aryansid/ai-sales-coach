// app/page.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const personas = [
  {
    id: 'artist',
    name: 'The Artist',
    description: 'Creative, design-focused buyers who value aesthetics',
    color: 'bg-purple-500'
  },
  {
    id: 'lifestyle',
    name: 'The Lifestyle Owner',
    description: 'Status-conscious buyers focused on luxury and experience',
    color: 'bg-blue-500'
  },
  {
    id: 'laggard',
    name: 'The Laggard Buyer',
    description: 'Traditional buyers who are slow to adopt new solutions',
    color: 'bg-orange-500'
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-serif mb-2">Sales Training Assistant</h1>
        <p className="text-gray-600 mb-12">Select a customer persona to begin training</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <Link href={`/training/${persona.id}`} key={persona.id}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-full ${persona.color} mb-4`} />
                <h2 className="text-xl font-semibold mb-2">{persona.name}</h2>
                <p className="text-gray-600">{persona.description}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </main>
  );
}
