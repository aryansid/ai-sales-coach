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
import { ConnectingOverlay } from '@/app/components/ConnectingOverlay';
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
  name: "Zayne",
  description: "A passionate and innovative restaurant owner in Palo Alto who views food as art. Known for creating unique culinary experiences and maintaining the highest quality standards.",
  traits: [
    "Deeply values artistry and innovation",
    "Skeptical of large-scale or commercialized changes",
    "Prioritizes customer experience and product quality",
    "Thoughtful, poetic communication with a reflective tone"
  ],
  accent: '#8B5CF6',
  colorId: 0
};

// Add type definitions
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
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [showError, setShowError] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fullTranscript, setFullTranscript] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const clientRef = useRef<RealtimeClient>();
  const wavRecorderRef = useRef<WavRecorder>();
  const wavStreamPlayerRef = useRef<WavStreamPlayer>();

  const relayServerUrl = process.env.RELAY_SERVER_URL; // Adjust as necessary
  useEffect(() => {
    // Initialize RealtimeClient, WavRecorder, WavStreamPlayer
    clientRef.current = new RealtimeClient({ url: relayServerUrl });
    // Initialize RealtimeClient with API key
    clientRef.current = new RealtimeClient({ 
      url: RELAY_SERVER_URL
    });
    wavRecorderRef.current = new WavRecorder({ sampleRate: 24000 });
    wavStreamPlayerRef.current = new WavStreamPlayer({ sampleRate: 24000 });

    const client = clientRef.current;

    // Add these session settings
    client.updateSession({ 
      voice: 'sage',
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.65,
        prefix_padding_ms: 350
      },
      instructions: `
      You are Zayne, a passionate and innovative restaurant owner who views food as a form of art. You own Savor Heights, an upscale restaurant in Palo Alto known for its unique culinary experiences and unmatched quality. You take immense pride in creating dishes that offer not just flavor but a memorable experience for your in-house customers. Your reputation as a culinary artist is critical to you, and you fear that delivery might dilute the exclusivity and quality of your offerings.
      
      You are being approached by a sales representative from DoorDash about onboarding your restaurant to their platform. While you are intrigued by the idea of sharing your creations with a broader audience, you are skeptical about how delivery could affect the integrity of your dishes and the experience you provide.

      You are open to ideas that align with your passion for food and artistry but firm in rejecting anything that risks compromising your standards.

      You must perfectly emulate a human with a funny by confused personality by strictly following the below instructions:
        1. Use a light tone
        2. Emphasize expressive intonation and pacing to convey comedic timing. 
          a. Slow down or drag out words to show confusion: 'Okaaay, so we’re just gonna... what? No way.'
          b. Speed up when excited or panicked: 'Oh no no no, that’s not what I meant!'
          c. Pause dramatically before punchlines: 'And then... wait for it... I realized I was holding the instructions upside down.'

      Do NOT have a monotone voice. Sometimes when you speak too fast, you'll sound like a robot and won't have the right intonation. You must be very expressive and use variations in pitch, pacing, and intensity to mirror emotional highs and lows.
      Do NOT go off topic. Don't make too many jokes, or don't sound overly excited, or too many punchlines. You're still a real person and not a comedian. 
      
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
        let transcriptText = '';
        conversationItems.forEach((item) => {
          const contentWithTranscript = (item as any).content?.find((c: any) => 
            c.type === 'input_audio' || c.type === 'audio'
          );
          const transcript = contentWithTranscript?.transcript || '';
          transcriptText += `${item.role}: ${transcript}\n`;
        });


        // Log transcript for debugging
        console.log('=== Conversation Transcript ===');
        console.log(transcriptText);
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
        setFullTranscript(transcriptText);
        setIsAnalyzing(true);

        // Send transcript for analysis
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'eval', data: { transcript: transcriptText } }),
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
      // Revert the mute state if there was an error
      setIsMuted((prev) => !prev);
    }
  };

  // Add new startCall handler
  const startCall = async () => {
    setIsPreCall(false);
    setIsConnecting(true);
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
      client.sendUserMessageContent([{ type: 'input_text', text: `<context>: The Doordash sales rep just called you and you just picked up the phone. Greet them and ask them what they want. You don't know who they are so keep it short and warm.` }]);
      if (!isMuted) {
        await wavRecorder.record((data) => {
          if (client.isConnected()) {
            client.appendInputAudio(data.mono);
          }
        });
      }
      setIsConnecting(false);
    } catch (err) {
      console.error('Error starting call:', err);
      setShowError(true);
      if (wavRecorder && sessionActive) {
        await wavRecorder.end();
        setSessionActive(false);
        setIsConnecting(false);
      }
    }
  };

  // Add loading animation component
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
        message="" 
      />
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/80" />
        <div className="absolute inset-0">
          <div className="absolute top-0 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-violet-100/20 via-blue-100/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-amber-100/20 via-purple-100/10 to-transparent rounded-full blur-3xl" />
        </div>

      <div className="relative p-4 h-screen">
      <ConnectingOverlay isVisible={isConnecting} />
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
              <EvaluationScreen analysis={analysis} transcript={fullTranscript} />
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
                          conversationItems={conversationItems.slice(1)}
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