'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '@/app/lib/wavtools';


export default function TrainingSession() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationItems, setConversationItems] = useState<ItemType[]>([]);

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

        // Set call as inactive after cleanup attempts
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
                onClick={toggleMute}
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
                  {conversationItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg mb-2 ${
                        item.role === 'user'
                          ? 'bg-blue-500 text-white ml-auto'
                          : 'bg-gray-200 text-black'
                      }`}
                    >
                      {item.formatted?.transcript || item.formatted?.text || ''}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
