import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client';

export const ChatInterface = ({ 
  conversationItems,
  isCallActive,
  isMuted,
  onToggleCall,
  onToggleMute
}: {
  conversationItems: ItemType[];
  isCallActive: boolean;
  isMuted: boolean;
  onToggleCall: () => void;
  onToggleMute: () => void;
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationItems]);

  const handleCallToggle = () => {
    console.log('Call button pressed');
    onToggleCall();
  };

  return (
    <div className="h-full w-full relative">
      {/* Chat Container with Fade Effects */}
      <div className="relative h-full">
        {/* Top Fade */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        
        {/* Messages Container */}
        <div 
          ref={messagesContainerRef} 
          className="h-full overflow-y-auto px-6"
        >
          <div className="py-6 space-y-4">
            {conversationItems.map((item) => {
              const content = item.formatted?.transcript || item.formatted?.text;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[80%] ${
                    item.role === 'user' ? 'ml-auto' : 'mr-auto'
                  }`}
                >
                  <div 
                    className={`
                      p-4 rounded-2xl backdrop-blur-md shadow-lg
                      ${item.role === 'user' 
                        ? 'bg-zinc-900/10 border border-zinc-800/10' 
                        : 'bg-violet-500/10 border border-violet-500/10'
                      }
                    `}
                  >
                    <div className={`
                      ${item.role === 'user' 
                        ? 'text-zinc-800' 
                        : 'text-violet-900'
                      }
                    `}>
                      {item.role === 'user' 
                        ? (content || <em>[inaudible]</em>)
                        : content
                      }
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      </div>

      {/* Control Bar - Fixed Position */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[300px] px-6 z-20">
        <motion.div 
          className="flex items-center justify-center gap-6 px-8 py-3 rounded-full bg-zinc-800/10 backdrop-blur-lg border border-zinc-700/10 shadow-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleMute}
            className={`p-2.5 rounded-full transition-colors duration-200
              ${isMuted 
                ? 'bg-zinc-800/10 text-zinc-600' 
                : 'bg-violet-500/20 text-violet-500'
              }
            `}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>

          <div className="w-px h-6 bg-zinc-300/20" />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCallToggle}
            className={`p-2.5 rounded-full transition-colors duration-200
              ${isCallActive 
                ? 'bg-red-500/20 text-red-500' 
                : 'bg-violet-500/20 text-violet-500'
              }
            `}
          >
            {isCallActive ? <PhoneOff className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};