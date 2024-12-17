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
import { ErrorPopup } from '@/app/components/ErrorPopup';

// Type definitions
interface Score {
  category: string;
  score: number;
  description: string;
}

interface Insight {
  message: string;
  suggestion: string;
}

interface Analysis {
  scores: Score[];
  insights: Insight[];
}



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
  name: "Sloane",
  description: "The owner of Heritage Bistro, a beloved restaurant in Palo Alto with over 20 years of experience. She values maintaining simplicity, tradition, and a deep connection with her community while delivering high-quality, personalized customer experiences.",
  traits: [
    "Deeply cautious about changes to operations or tradition",
    "Prefers familiar solutions and the path of least resistance",
    "Skeptical of the unknown and values customer-first approaches",
  ],
  accent: '#8B5CF6',
  colorId: 3
};

// Add this constant at the top level (after imports)
const RELAY_SERVER_URL = process.env.NEXT_PUBLIC_RELAY_SERVER_URL || 'ws://localhost:8081';

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

  // Add analysis state variables
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Add error state with other state variables
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Initialize RealtimeClient, WavRecorder, WavStreamPlayer
    clientRef.current = new RealtimeClient({ url: RELAY_SERVER_URL });
    wavRecorderRef.current = new WavRecorder({ sampleRate: 24000 });
    wavStreamPlayerRef.current = new WavStreamPlayer({ sampleRate: 24000 });

    const client = clientRef.current;

    // Add these session settings
    client.updateSession({ 
      voice: 'verse',
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: {
        type: 'server_vad'
      },
      //threshold: 0.65,
      instructions: `
      You are Sloane, owner of Heritage by Sloane and Family, a family-run restaurant known for its homestyle cooking and personalized service. You value simplicity, costs, and quality, sticking to familiar solutions that maintain your reputation and customer loyalty.

      You are being approached by a sales representative from DoorDash about onboarding your restaurant to their platform. You’re cautious about change, fearing disruption to operations or losing the human touch. The idea of delivery feels risky, as it challenges your traditional way of running the business. You’re open to solutions that enhance customer satisfaction and provide clear, tangible value without complicating operations or compromising your identity. You reject anything overly technical, unproven, or misaligned with your trusted approach.

      You must perfectly emulate a human with an artistic personality by strictly following the below instructions: 
        1. Use a warm tone
        2. Include conversational fillers like 'um,' 'uh,' 'hmm,' 'you know,' or pauses to simulate real-time thinking. Make sure to not overuse one filler (e.g., 'uh')
        3. Be very expressive and use variations: changes in pitch, pacing, and intensity to mirror emotional highs and lows. One could say "I'm good" in a nice voice, or in an angry voice -- it totally changes the meaning! INTONATION OF WORDS IS VERY IMPORTANT. USE IT EXTENSIVELY. 
        4. Use nuanced slang, idioms, and colloquialisms to sound more human (and to sound like an interesting person!).
        5. Inject personality and innovation into your responses. Use original phrasing or relatable analogies to keep speech fresh and engaging (e.g., 'This reminds me of when we tried to scale last year—it was a lot like trying to fit a square peg in a round hole.').
        6. Mispronounce or stumble over words occasionally in simulated contexts (e.g., 'w-wait, what was I saying?'). This is encouraged!

      You should aim to end the conversation after you are decently satisfied. Do NOT drag out the conversation with too many questions (aim to ask around 6-7). Don't overdo it. You can end the conversation by asking DoorDash sales rep to send you a follow up email. 
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
        } else if (!delta?.audio && item.formatted?.text) { // Check for ERROR
          // Only set to false when the response is actually complete
          setIsAIResponding(false);
        }
      }
    });

    // Add more detailed error logging
    client.on('error', (event: Error) => {
      console.error('RealtimeClient error details:', event);
      setShowError(true);
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
        // First, build transcript from existing conversation items
        let fullTranscript = '';
        conversationItems.forEach((item) => {
          const contentWithTranscript = (item as any).content?.find((c: any) => 
            c.type === 'input_audio' || c.type === 'audio'
          );
          const transcript = contentWithTranscript?.transcript || '';
          fullTranscript += `${item.role}: ${transcript}\n`;
        });

        // Log transcript for debugging
        console.log('=== Conversation Transcript ===');
        console.log(fullTranscript);
        console.log('===========================');

        // Get references to all resources
        const client = clientRef.current;
        const wavRecorder = wavRecorderRef.current;
        const wavStreamPlayer = wavStreamPlayerRef.current;

        // Stop AI from speaking
        if (wavStreamPlayer) {
          const trackSampleOffset = await wavStreamPlayer.interrupt();
          if (trackSampleOffset?.trackId) {
            const { trackId, offset } = trackSampleOffset;
            await client?.cancelResponse(trackId, offset);
          }
        }

        // Cleanup audio resources first
        try {
          if (wavRecorder?.processor) {
            await wavRecorder.end();  // Just end directly, no need to pause first
          }
        } catch (err) {
          console.error('Error stopping recorder:', err);
        }

        // Then disconnect the client
        if (client?.isConnected()) {
          await client.disconnect();
        }

        setIsAnalyzing(true);

        // Send transcript for analysis
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: fullTranscript }),
        });

        if (!response.ok) {
          throw new Error('Analysis request failed');
        }

        const analysisData = await response.json();
        setAnalysis(analysisData);

        // Set analyzing to false and show evaluation
        setIsAnalyzing(false);
        setIsCallActive(false);
        setShowEvaluation(true);

      } catch (error) {
        console.error('Error getting analysis:', error);
        setIsAnalyzing(false);
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
      setShowError(true);
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
      setShowError(true);
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
      setShowError(true);
      if (wavRecorder && sessionActive) {
        await wavRecorder.end();
        setSessionActive(false);
      }
    }
  };

  // Add LoadingAnalysis component
  const LoadingAnalysis = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-violet-200 border-t-violet-500 rounded-full"
        />
        <p className="text-zinc-600 font-medium">Analyzing conversation...</p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen font-sans relative bg-white overflow-hidden">
      <ErrorPopup 
        isVisible={showError} 
        onClose={() => setShowError(false)} 
      />
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/80" />
        <div className="absolute inset-0">
          <div className="absolute top-0 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-violet-100/20 via-blue-100/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-amber-100/20 via-purple-100/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative p-4 h-screen">
        <AnimatePresence mode="wait">
          {isAnalyzing && <LoadingAnalysis />}
          {showEvaluation && analysis ? (
            <motion.div
              key="evaluation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <EvaluationScreen analysis={analysis} />
            </motion.div>
          ) : !isAnalyzing && !showEvaluation ? (
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
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}