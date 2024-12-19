import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client';

type TranscriptionStatus = 'transcribing' | 'completed' | 'inaudible' | 'in_progress';

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
    //console.log('Call button pressed');
    onToggleCall();
  };

  const getMessageContent = (item: ItemType): { content: string; status: TranscriptionStatus } => {
    /*if ((item as any)?.status === 'in_progress') { // TODO: Fix this
      return {
        content: '',
        status: 'transcribing'
      };
    }*/
  
    const audioContent = ('content' in item) 
      ? item.content?.find(c => c.type === 'input_audio' || c.type === 'audio')
      : null;
  
    if (audioContent?.transcript) {
      return { 
        content: audioContent.transcript,
        status: 'completed'
      };
    }
  
    // Fall back to formatted content
    const formattedContent = item.formatted?.transcript || item.formatted?.text;
    if (formattedContent) {
      return {
        content: formattedContent,
        status: 'completed'
      };
    }
    return {
      content: '',
      status: item.role === 'user' ? 'transcribing' : 'completed'
    };
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
              const { content, status } = getMessageContent(item);
              
              // Skip rendering if content is empty or only whitespace
              //if (!content?.trim() && status === 'completed') return null;
              
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
                      {status === 'transcribing' ? (
                        <TranscribingIndicator />
                      ) : status === 'inaudible' ? (
                        <span className="text-zinc-500 italic">
                          [Unable to transcribe audio]
                        </span>
                      ) : (
                        content
                      )}
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


const TranscribingIndicator = () => (
  <div className="flex items-center gap-2">
    <div className="text-sm text-zinc-500">Transcribing</div>
    <div className="flex gap-1">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-violet-500/50 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  </div>
);