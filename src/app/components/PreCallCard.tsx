import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';

interface PreCallCardProps {
  persona: {
    name: string;
    scenario: string;
  };
  onStartCall: () => void;
}

const PreCallCard = ({ persona, onStartCall }: PreCallCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      className="bg-white/50 backdrop-blur-sm rounded-2xl border border-zinc-200 shadow-sm p-6
                 w-full relative z-10"
    >
      <div className="space-y-4">
        <h2 className="font-serif text-2xl text-zinc-900">{persona.name}</h2>
        <p className="text-zinc-600 leading-relaxed">{persona.scenario}</p>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStartCall}
        className="w-full py-3 px-4 rounded-xl bg-violet-50 hover:bg-violet-100 
                   border border-violet-200 text-violet-700 font-medium
                   flex items-center justify-center gap-2 transition-colors
                   mt-6"
      >
        <Phone className="w-5 h-5" />
        Start Conversation
      </motion.button>
    </motion.div>
  );
};

export default PreCallCard;