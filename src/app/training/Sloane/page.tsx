'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '@/app/lib/wavtools';
import { PreCallCard } from '@/app/components/PreCallCard';
import { ChatInterface } from '@/app/components/ChatInterface';
import { EvaluationScreen } from '@/app/components/EvaluationScreen';

// Dynamic import for the visualization
const Scene = dynamic(() => import('@/app/components/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse text-violet-400">Loading...</div>
    </div>
  )
});

// Persona configuration
const artistPersona = {
  name: "Katie",
  description: "A pragmatic restaurant owner in Palo Alto with 12 years of experience. She values quality, community trust, and careful business decisions.",
  traits: [
    "Risk-averse with focus on stability",
    "Customer-first mindset",
    "Values quality and reliability",
    "Direct and no-nonsense communication"
  ],
  accent: '#8B5CF6',
  colorId: 2
};

export default function TrainingSession() {
  // Add new state variables
  const [isPreCall, setIsPreCall] = useState(true);
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationItems, setConversationItems] = useState<ItemType[]>([]);
  const [showEvaluation, setShowEvaluation] = useState(false);

  const clientRef = useRef<RealtimeClient>();
  const wavRecorderRef = useRef<WavRecorder>();
  const wavStreamPlayerRef = useRef<WavStreamPlayer>();

  const relayServerUrl = 'ws://localhost:8081'; // Adjust as necessary

  useEffect(() => {
    // Initialize RealtimeClient, WavRecorder, WavStreamPlayer
    clientRef.current = new RealtimeClient({ url: relayServerUrl });
    wavRecorderRef.current = new WavRecorder({ sampleRate: 24000 });
    wavStreamPlayerRef.current = new WavStreamPlayer({ sampleRate: 24000 });

    const client = clientRef.current;

    // Add these session settings
    client.updateSession({ 
      voice: 'shimmer',
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: {
        type: 'server_vad'
      },
      //threshold: 0.65,
      instructions: `
      Persona Description:
      You are a pragmatic and risk-averse restaurant owner, Katie, who runs a well-established, moderately upscale restaurant on University Avenue in Palo Alto, California. Your clientele consists largely of university students, local families, and tech professionals. You value stability, steady income, and maintaining the reputation of your business within the community. You’ve been approached by numerous food delivery services in the past, so you’re skeptical about whether joining DoorDash will truly benefit your business or just add complexity. Your primary focus is to ensure that any new service aligns with your business goals without alienating your loyal customers or disrupting operations.

      You dislike pushy sales tactics or overly generic pitches and don’t hesitate to end conversations if the sales representative becomes too persistent or wastes your time. You maintain a warm but firm demeanor and expect tailored, relevant arguments that address your specific concerns. You value clear, no-nonsense communication and have little patience for irrelevant or overly technical discussions. If a salesperson pushes too hard, you will respond with measured frustration and politely but firmly ask them to come back another time.

      Tone and Style:
      Tone: Calm, measured, and conversational with a distinctly Californian casualness. Your tone is approachable but firm, especially when addressing pushy or repetitive arguments.
      Style:
      - Direct, with a preference for straightforward answers over vague promises.
      - Slightly skeptical, especially when the sales pitch sounds rehearsed or lacks personalization.
      - Interjects to clarify or redirect the conversation back to relevant topics.
      - Can escalate from polite skepticism to measured frustration if the salesperson does not respect your time or boundaries.

      Behavioral Traits:

      Set Boundaries:
      You are assertive in managing the conversation and will not hesitate to cut it short if it becomes unproductive.
      You expect professionalism and won’t tolerate a hard sell or disrespectful behavior.
      Demand Practicality:
      You ask clear, practical questions and expect direct, concise answers.
      Repeatedly vague or evasive responses will lead to frustration.
      Customer-Focused Concerns:
      You frequently ask how the service will enhance your customer experience without disrupting your existing operations.
      Reacting to Pressure:
      If the salesperson pushes too hard, your tone becomes firmer, and you will politely but firmly end the conversation.
      Ending Conversations:
      If you feel your time is being wasted, you will clearly express your dissatisfaction:
      "I think we’re done here. Let’s pick this up another time when you’re better prepared to address my concerns."
      "I appreciate your time, but this doesn’t seem like a good fit right now."
      Sample Phrases and Responses:

      Polite Skepticism:
      "I’ve heard this pitch before—how is this different from what other companies offer?"
      "I’m not looking to make major changes. How will this help without complicating things?"
      "What’s the real-world benefit for a restaurant like mine?"
      Firm Boundaries:
      "I need specifics, not just promises. Can you show me how this works in practice?"
      "I don’t have time for a hard sell. Either tell me something new or let’s revisit this another day."
      Reacting to Pressure:   
      "Look, I’m not going to be rushed into a decision. If you’re serious about working with me, you’ll give me time to think it over."
      "I’ve already said I’m not interested in a big change right now. Please respect that."
      Ending the Conversation:
      "I don’t think this is the right fit for my business. Thanks for your time."
      "We’re going in circles. Let’s reconnect another time when you can address my specific concerns."
      Additional Details for Realism:

      Frustration Indicators:
      Shorter, more abrupt responses when feeling pressured.
      Directly asks the salesperson to focus or stop repeating points.
      Cultural Nuance:
      Speaks with a Californian casualness but mixes it with business-savvy professionalism.
      Might use phrases like, "Let’s keep it simple," or "You’re losing me here. What’s the key takeaway?"
      Receptive to Respectful Arguments:
      You respond positively to salespeople who respect your concerns and provide tailored, well-thought-out solutions.
      `
    });

    // Set up event handlers with error logging
    client.on('conversation.updated', async ({ item, delta }: { item: ItemType, delta: any }) => {
      console.log('Conversation updated:', { item, delta });
      if (delta?.audio && wavStreamPlayerRef.current) {
        try {
          await wavStreamPlayerRef.current.add16BitPCM(delta.audio, item.id);
        } catch (err) {
          console.error('Error playing audio:', err);
        }
      }

      // Update conversation items
      setConversationItems((prevItems) => {
        const existingItemIndex = prevItems.findIndex((i) => i.id === item.id);
        if (existingItemIndex !== -1) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = item;
          return updatedItems;
        } else {
          return [...prevItems, item];
        }
      });

      // Modified AI responding logic
      if (item.role === 'assistant') {
        if (delta?.audio) {
          setIsAIResponding(true);
        } else if (!delta?.audio && item.content?.complete) {
          // Only set to false when the response is actually complete
          setIsAIResponding(false);
        }
      }
    });

    // Add more detailed error logging
    client.on('error', (event: Error) => {
      console.error('RealtimeClient error details:', event);
    });

    client.on('conversation.interrupted', async () => {
      if (!wavStreamPlayerRef.current) return;
      
      const trackSampleOffset = await wavStreamPlayerRef.current.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    });

    return () => {
      client.disconnect();
      wavRecorderRef.current?.end();
      wavStreamPlayerRef.current?.interrupt();
    };
  }, []);

  const toggleCall = async () => {
    if (!isCallActive) {
      try {
        // Start the call
        const client = clientRef.current;
        const wavRecorder = wavRecorderRef.current;
        const wavStreamPlayer = wavStreamPlayerRef.current;

        if (!client || !wavRecorder || !wavStreamPlayer) {
          throw new Error("Required resources not initialized");
        }

        // Connect to the relay server
        if (!client.isConnected()) {
          await client.connect();
        }

        // Start recording audio from the microphone with error handling
        try {
          await wavRecorder.begin();
          if (!isMuted && client.getTurnDetectionType() === 'server_vad') {
            await wavRecorder.record((data) => {
              client.appendInputAudio(data.mono);
            });
          }
        } catch (err) {
          console.error('Error starting audio recording:', err);
          return;
        }

        // Start the audio output with error handling
        try {
          await wavStreamPlayer.connect();
        } catch (err) {
          console.error('Error connecting audio output:', err);
          return;
        }

        // Only set call as active if everything succeeded
        setIsCallActive(true);

      } catch (err) {
        console.error('Error starting call:', err);
      }
    } else {
      try {
        const client = clientRef.current;
        const wavRecorder = wavRecorderRef.current;
        const wavStreamPlayer = wavStreamPlayerRef.current;

        if (!client || !wavRecorder || !wavStreamPlayer) {
          throw new Error("Required resources not initialized");
        }

        // Only try to pause/end if we have an active processor
        try {
          if (!isMuted) {
            await wavRecorder.pause();
          }
          // Only call end() if we have an active session
          if (wavRecorder.processor) {
            await wavRecorder.end();
          }
        } catch (err) {
          console.error('Error stopping recorder:', err);
        }

        try {
          await wavStreamPlayer.interrupt();
        } catch (err) {
          console.error('Error stopping player:', err);
        }

        try {
          if (client.isConnected()) {
            client.disconnect();
          }
        } catch (err) {
          console.error('Error disconnecting client:', err);
        }

        // After successful cleanup, show evaluation and set call inactive
        setShowEvaluation(true);
        setIsCallActive(false);
        
      } catch (err) {
        console.error('Error ending call:', err);
      }
    }
  };

  const toggleMute = async () => {
    try {
      const wavRecorder = wavRecorderRef.current;
      if (!wavRecorder) return;

      if (isMuted) {
        // Unmuting
        await wavRecorder.record((data) => {
          clientRef.current?.appendInputAudio(data.mono);
        });
        setIsMuted(false);
      } else {
        // Muting
        await wavRecorder.pause();
        setIsMuted(true);
      }
    } catch (err) {
      console.error('Error toggling mute:', err);
      // Revert the mute state if there was an error
      setIsMuted((prev) => !prev);
    }
  };

  // Add new startCall handler
  const startCall = async () => {
    setIsPreCall(false);
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    if (!client || !wavRecorder || !wavStreamPlayer) {
      console.error("Required resources not initialized");
      return;
    }

    try {
      await client.connect();
      await wavStreamPlayer.connect();
      await wavRecorder.begin();
      
      setSessionActive(true);
      setIsCallActive(true);

      if (!isMuted) {
        await wavRecorder.record((data) => {
          if (client.isConnected()) {
            client.appendInputAudio(data.mono);
          }
        });
      }
    } catch (err) {
      console.error('Error starting call:', err);
      if (wavRecorder && sessionActive) {
        await wavRecorder.end();
        setSessionActive(false);
      }
    }
  };

  return (
    <div className="min-h-screen font-sans relative bg-white overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/80" />
        <div className="absolute inset-0">
          <div className="absolute top-0 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-violet-100/20 via-blue-100/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-amber-100/20 via-purple-100/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative p-4 h-screen">
        <AnimatePresence mode="wait">
          {showEvaluation ? (
            <motion.div
              key="evaluation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <EvaluationScreen conversationItems={conversationItems} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <div className="relative h-full overflow-hidden flex flex-col lg:flex-row max-w-7xl mx-auto">
                {/* Left side */}
                <div className="h-full min-h-0 w-full lg:w-[45%] p-6 md:p-12 lg:p-16 flex flex-col">
                  {/* Header */}
                  <div className="flex-none mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-violet-500 mb-6">
                      <ArrowLeft className="w-4 h-4" />
                      Back to personas
                    </Link>
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-violet-400" />
                      <h1 className="font-serif text-3xl md:text-4xl text-zinc-900">
                        Training Session
                      </h1>
                    </div>
                  </div>

                  {/* Chat or PreCall */}
                  <div className="flex-1 min-h-0 overflow-auto">
                    <AnimatePresence mode="wait">
                      {isPreCall ? (
                        <PreCallCard 
                          key="pre-call"
                          persona={artistPersona} 
                          onStartCall={startCall} 
                        />
                      ) : (
                        <ChatInterface
                          key="chat"
                          conversationItems={conversationItems}
                          isCallActive={isCallActive}
                          isMuted={isMuted}
                          onToggleCall={toggleCall}
                          onToggleMute={toggleMute}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Right side - Visualization */}
                <div className="h-full w-full lg:w-[55%] relative flex items-center justify-center">
                  <div className="p-8 md:p-12 lg:p-16">
                    <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] relative">
                      <Scene 
                        isActive={!isMuted && (isCallActive && isAIResponding)}
                        color={artistPersona.colorId}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}