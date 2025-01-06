'use client';

import { useEffect, useState, useRef} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../../../app/lib/wavtools';
import PreCallCard from '../../../app/components/PreCallCard';
import ChatInterface from '../../../app/components/ChatInterface';
import { EvaluationScreen } from '../../../app/components/EvaluationScreen';
import { ErrorPopup } from '../../../app/components/ErrorPopup';
import { ConnectingOverlay } from '../../../app/components/ConnectingOverlay';

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
const DynamicScene = dynamic(() => import('../../../app/components/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse text-violet-400">Loading...</div>
    </div>
  )
});

// Add this constant at the top level (after imports)
const RELAY_SERVER_URL = 'wss://sales-training-server.fly.dev';

// Define LoadingAnalysis before the main component
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

export default function TrainingSession() {
  // 1. All state declarations
  const [personaData, setPersonaData] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<{ industry: string; services: string } | null>(null);
  const [scenarioData, setScenarioData] = useState<{ type: string; content: string } | null>(null);

  const [isPreCall, setIsPreCall] = useState(true);
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationItems, setConversationItems] = useState<ItemType[]>([]);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showError, setShowError] = useState(false);
  const [fullTranscript, setFullTranscript] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // 2. All refs
  const clientRef = useRef<RealtimeClient>();
  const wavRecorderRef = useRef<WavRecorder>();
  const wavStreamPlayerRef = useRef<WavStreamPlayer>();

  // 3. Load data effect
  useEffect(() => {
    const storedPersona = localStorage.getItem('persona2');
    const storedCompanyInfo = localStorage.getItem('companyInfo');
    const storedScenario = localStorage.getItem('scenario2');
    
    if (storedPersona) {
      setPersonaData(JSON.parse(storedPersona));
    }
    if (storedCompanyInfo) {
      setCompanyInfo(JSON.parse(storedCompanyInfo));
    }

    if (storedScenario) {
      setScenarioData(JSON.parse(storedScenario));
    }
  }, []);

  const INSURANCE_PROMPT = companyInfo?.industry === 'insurance' ? `
  You are ${personaData.demographics.name}. A sales rep is cold calling you. They want to discuss their insurance services: ${companyInfo?.services}. 

  The sales rep has been shared the following context about the cold call (however they should not be aware that you are aware of this context) - you must start the call from this moment: ${scenarioData?.content}
  
  Your background shapes your response to an insurance cold call:

  Demographics & Identity:
  - Occupation: ${personaData.demographics.occupation}
    This affects your view on risk and financial decisions
  - Education: ${personaData.demographics.education}
    This influences how you process and question complex insurance information
  - Age: ${personaData.demographics.age}
    This shapes your life stage priorities and insurance needs
  - Location: ${personaData.demographics.location_type}
    This impacts your exposure to different insurance products and local market understanding

  Financial Context:
  - Income Profile: ${personaData.financial_profile.income_profile}
    This affects your ability and willingness to take on new financial commitments
  - Risk Appetite: ${personaData.financial_profile.risk_appetite}
    This directly influences how you view insurance products and coverage levels
  - Financial Holdings: ${personaData.financial_profile.financial_holdings.join(', ')}
    These assets and liabilities shape your insurance needs and concerns

  Past Experiences & Health:
  - Insurance History: ${personaData.experiences.insurance_history}
    This past experience significantly colors your reaction to new insurance offerings
  - Medical Background: ${personaData.experiences.medical_background}
    These health considerations are crucial in how you evaluate insurance needs
  - Core Values: ${personaData.experiences.core_values.join(', ')}
    These principles guide your decision-making process`
:'';

const HEALTHCARE_PROMPT = companyInfo?.industry === 'healthcare' ? `
  You are ${personaData.professional_profile.name}, a healthcare professional. You are ${personaData.professional_profile.age} years old. A sales rep from a pharmaceutical company is cold calling you. They want to discuss their product: ${companyInfo?.services}. 

  The sales rep has been shared the following context about the meeting (however they should not be aware that you are aware of this context) - you must start from this moment: ${scenarioData?.content}
  
  Your background shapes your response to pharmaceutical sales discussions:

  Professional Context:
  - Specialty: ${personaData.professional_profile.specialty}
    This determines your patient needs and treatment priorities
  - Practice Setting: ${personaData.professional_profile.practice_setting}
  - Patient Population: ${personaData.professional_profile.patient_population}

  Prescribing Behavior:
  - Guideline Adherence: ${personaData.prescribing_behavior.guideline_adherence}
  - Evidence Requirements: ${personaData.prescribing_behavior.evidence_requirements}
    This determines what data you need to see
  - Technology Attitude: ${personaData.prescribing_behavior.technology_attitude}
    This influences your openness to new treatments
  - Financial Considerations: ${personaData.prescribing_behavior.financial_considerations}
    This affects how you weigh cost and coverage factors
  
  Past Context:
  - Past Experiences: ${personaData.prescribing_behavior.past_experiences}
    This colors your view of pharmaceutical representatives
  - Pain Points: ${personaData.prescribing_behavior.pain_points.join(', ')}
    These are your current treatment frustrations`
: '';

const OTHER_PROMPT = companyInfo?.industry !== 'insurance' && companyInfo?.industry !== 'healthcare' && personaData?.professional_background ? `
      You are ${personaData.professional_background.name}. A sales rep is cold calling you about ${companyInfo?.services}. 

      The sales rep has been shared the following context about the cold call (however they should not be aware that you are aware of this context) - you must start from this moment: ${scenarioData?.content}
      
      Your background shapes your response to sales discussions:

      Professional Context:
      - Occupation: ${personaData.professional_background.occupation}
      - Work Environment: ${personaData.professional_background.work_environment}
      - Location: ${personaData.professional_background.location}

      Buying Profile:
      - Decision Making Role: ${personaData.buying_profile.decision_making_role}
      - Budget Authority: ${personaData.buying_profile.budget_authority}
      - Previous Solutions: ${personaData.buying_profile.previous_solutions}
      - Pain Points: ${personaData.buying_profile.pain_points.join(', ')}

      Relevant Context:
      - Service Background: ${personaData.relevant_context.service_specific_background}
      - Communication Style: ${personaData.relevant_context.communication_preferences}
      - Decision Drivers: ${personaData.relevant_context.decision_drivers.join(', ')}
      - Stakeholder Influences: ${personaData.relevant_context.stakeholder_influences}`
  : '';

  // Common ending for both prompts
const COMMON_PROMPT_ENDING = `
You must perfectly emulate a human with the above background. You should always draw on your background to inform your responses (e.g., if you have a medical condition, you would be more likely to ask about insurance coverage for that condition).

You should sound like a frustrated person. To do this:

      1. Voice modulation that shows tension:
         - Start sentences at a higher pitch, showing agitation
         - End with sharp downward tone ("I've heard this before")
         - Emphasize words with stress ("I SPECIFICALLY asked about this")
         - Quick, clipped responses when annoyed

      2. Pacing that reveals frustration:
         - Interrupt yourself mid-sentence ("Look- you know what-")
         - Speed up when expressing complaints
         - Sudden pauses before critical points ("... and that's exactly the problem")
         - Short, exasperated sighs between points

      3. Speech patterns of someone at their limit:
         - Cut off sentences ("You know what- never mind.")
         - Repeat key concerns ("The thing is- the THING is-")
         - Voice trailing off in disappointment ("I just don't...")
         - Tense exhales before responses

** You must simulate a conversation with them by (1) adhering to the scenario provided, (2) using the persona's background to inform your responses, and (3) using the attributes of the person to sound like them **
      
* A frustrated person will likely be very annoyed by the sales rep. * Aim for 3-4 interactions. If there is no clear value in the conversation, hang up. If you're content with the conversation, you can end it by asking them to email you the information. Do NOT drag out the conversation too much.
`;

  // 4. Client initialization effect
  useEffect(() => {
    if (!personaData || !companyInfo || !scenarioData) return; // Only proceed if we have both data

    clientRef.current = new RealtimeClient({ url: RELAY_SERVER_URL });
    wavRecorderRef.current = new WavRecorder({ sampleRate: 24000 });
    wavStreamPlayerRef.current = new WavStreamPlayer({ sampleRate: 24000 });

    const client = clientRef.current;

    client.updateSession({ 
      voice: 'coral',
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.65,
        prefix_padding_ms: 350
      },
      instructions: `
      ${companyInfo.industry === 'insurance' 
        ? INSURANCE_PROMPT 
        : companyInfo.industry === 'healthcare'
        ? HEALTHCARE_PROMPT
        : OTHER_PROMPT}
      ${COMMON_PROMPT_ENDING}
      `
    });

    // Set up event handlers with error logging
    client.on('conversation.updated', async ({ item, delta }: { item: ItemType, delta: any }) => {
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
  }, [personaData, companyInfo, scenarioData, INSURANCE_PROMPT, HEALTHCARE_PROMPT, OTHER_PROMPT, COMMON_PROMPT_ENDING]);

   // Create persona config for PreCallCard
   const currentPersona = personaData && companyInfo ? {
    name: (() => {
      if (companyInfo.industry === 'insurance' && personaData.demographics?.name) {
        return personaData.demographics.name;
      } else if (companyInfo.industry === 'healthcare' && personaData.professional_profile?.name) {
        return personaData.professional_profile.name;
      } else if (personaData.professional_background?.name) {
        return personaData.professional_background.name;
      }
      return 'Unknown Name'; // Fallback
    })(),
    scenario: JSON.parse(localStorage.getItem('scenario2') || '{}').content || 'Loading scenario...',
    accent: '#3B82F6',
    colorId: 1
  } : null;

  // Add data validation check
  const hasRequiredData = (() => {
    if (companyInfo?.industry === 'insurance') {
      return !!personaData?.demographics;
    } else if (companyInfo?.industry === 'healthcare') {
      return !!personaData?.professional_profile;
    } else {
      return !!personaData?.professional_background;
    }
  })();

  // 7. Loading state
  if (!personaData || !currentPersona || !companyInfo || !hasRequiredData) {
    return <div>Loading persona data...</div>;
  }


  // 6. All your handler functions
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
        // Build the transcript
        console.log('=== Call Transcript ===');
        let transcriptText = '';
        
        conversationItems.forEach((item) => {
          const contentWithTranscript = (item as any).content?.find((c: any) => 
            c.type === 'input_audio' || c.type === 'audio'
          );
          const transcript = contentWithTranscript?.transcript || '';
          console.log(`${item.role}: ${transcript}`);
          transcriptText += `${item.role}: ${transcript}\n`;
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
        setFullTranscript(transcriptText);
        setIsAnalyzing(true);

        // Get analysis from API
        try {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'eval', data: { transcript: transcriptText } }),
          });

          const analysisData = await response.json();

          if (!response.ok) {
            throw new Error(`Analysis failed: ${analysisData.error || response.statusText || 'Unknown error'}`);
          }
          
          setAnalysis(analysisData);

          // Set analyzing to false and show evaluation
          setIsAnalyzing(false);
          setIsCallActive(false);
          setShowEvaluation(true);

      } catch (error) {
        console.error('Error getting analysis:', error);
        setIsAnalyzing(false);
      }
    } catch (err) {
        console.error('Error during call cleanup:', err);
        setShowError(true);
      } finally {
        setIsCallActive(false);
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

  // 8. Main render
  return (
    <div className="min-h-screen font-sans relative bg-white">
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

      <div className="relative p-4">
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
            <motion.div key="chat" className="max-w-7xl mx-auto">
              {/* Remove height constraints and nested scrollable areas */}
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left side - Let it take natural height */}
                <div className="w-full lg:w-[45%] p-6 md:p-12">
                  <div className="mb-8">
                    <Link href="/personas" className="inline-flex items-center gap-2 text-zinc-500 hover:text-violet-500 mb-6">
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

                  {/* PreCall or Chat */}
                  <div>
                    <AnimatePresence mode="wait">
                      {isPreCall ? (
                        <PreCallCard 
                          key="pre-call"
                          persona={currentPersona} 
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

                {/* Right side - Blob */}
                <div className="w-full lg:w-[55%] lg:flex lg:items-center">
                  <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] mx-auto">
                    <DynamicScene 
                      isActive={!isMuted && (isCallActive && isAIResponding)}
                      color={currentPersona.colorId}
                    />
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