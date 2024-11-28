
// app/training/[personaId]/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { useChat } from 'ai/react';

export default function TrainingSession({ params }: { params: { personaId: string } }) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    body: {
      persona: params.personaId
    }
  });

  const toggleCall = () => {
    setIsCallActive(!isCallActive);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Training Call</h1>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleCall}
                className={`p-3 rounded-full ${
                  isCallActive ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                }`}
              >
                {isCallActive ? <PhoneOff className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {isCallActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg mb-2 ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white ml-auto' 
                          : 'bg-gray-200'
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex gap-4">
                  <input
                    value={input}
                    onChange={handleInputChange}
                    className="flex-1 p-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your response..."
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Send
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}