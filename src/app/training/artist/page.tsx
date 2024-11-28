'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { ReactMic } from 'react-mic';

export default function TrainingSession({ params }: { params: { personaId: string } }) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = () => {
    if (wsRef.current) return;

    wsRef.current = new WebSocket('ws://localhost:3000/api/realtime');

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      wsRef.current?.send(JSON.stringify({ type: 'session.start', persona: params.personaId }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket message:', data);

      if (data.type === 'response.text') {
        setMessages((prev) => [
          ...prev,
          { id: data.id, role: 'assistant', content: data.content },
        ]);
      } else if (data.type === 'response.audio') {
        setAudioSource(`data:audio/wav;base64,${data.audio}`);
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket closed');
      wsRef.current = null;
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const toggleCall = () => {
    setIsCallActive(!isCallActive);
    setIsRecording(!isCallActive); // Start/stop recording based on call state
    if (!isCallActive) {
      connectWebSocket();
    } else if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const handleAudioStop = async (recordedBlob: Blob) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (base64Audio) {
          wsRef.current?.send(
            JSON.stringify({
              type: 'input.audio',
              audio: base64Audio,
            })
          );
        }
      };
      reader.readAsDataURL(recordedBlob);
    } else {
      console.error('WebSocket is not connected');
    }
  };

  useEffect(() => {
    if (audioSource && audioRef.current) {
      audioRef.current.play();
    }
  }, [audioSource]);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Voice Training Session</h1>
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

                <ReactMic
                  record={isRecording}
                  onStop={handleAudioStop}
                  className="hidden"
                  strokeColor="#000000"
                  backgroundColor="#ffffff"
                />
                <p className="text-sm text-gray-500">
                  {isRecording ? 'Recording...' : 'Call not active.'}
                </p>

                {audioSource && (
                  <audio ref={audioRef} src={audioSource} controls className="mt-4"></audio>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
