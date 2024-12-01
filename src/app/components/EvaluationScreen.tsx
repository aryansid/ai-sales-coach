// EvaluationScreen.tsx
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client';
import { motion } from 'framer-motion';
import { MessageCircle, Brain, Shield, Target, Sparkles, LightbulbIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

// Map category names to their respective icons
const categoryIcons = {
  'Understanding & Personalization': Brain,
  'Objection Handling & Trust': Shield,
  'Value Communication': Target
};

const ScoreCard = ({ icon: Icon, category, score, description }: {
  icon: LucideIcon;
  category: string;
  score: number;
  description: string;
}) => {
  // Calculate gradient color based on score
  const getScoreColor = (score) => {
    if (score >= 90) return 'from-emerald-500/20 to-emerald-500/5';
    if (score >= 75) return 'from-violet-500/20 to-violet-500/5';
    return 'from-amber-500/20 to-amber-500/5';
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden"
    >
      <div className={`
        p-8 rounded-3xl backdrop-blur-md 
        bg-gradient-to-b ${getScoreColor(score)}
        border border-white/10
        flex flex-col h-full
        transition-all duration-300 ease-in-out
      `}>
        <div className="flex items-start justify-between mb-6">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
            <Icon className="w-6 h-6 text-zinc-700" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500">
              {score}
            </div>
            <div className="text-lg text-zinc-400">/100</div>
          </div>
        </div>
        
        <h3 className="text-xl font-medium text-zinc-800 mb-3">{category}</h3>
        <p className="text-sm text-zinc-600 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

const FeedbackItem = ({ message, suggestion }: {
  message: string;
  suggestion: string;
}) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      className="p-6 rounded-2xl backdrop-blur-md bg-zinc-900/5 border border-zinc-300/20 
                shadow-[0_4px_12px_-6px_rgba(0,0,0,0.08),0_4px_16px_-10px_rgba(0,0,0,0.06)]
                hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.1),0_8px_24px_-12px_rgba(0,0,0,0.08)]
                hover:bg-zinc-900/10 transition-all duration-300 ease-in-out"
    >
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <MessageCircle className="w-5 h-5 text-zinc-400" />
        </div>
        <div>
          <div className="text-sm text-zinc-500 italic mb-3 leading-relaxed">"{message}"</div>
          <div className="flex items-start gap-3 bg-white/40 p-4 rounded-xl
                          shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04),0_2px_12px_-8px_rgba(0,0,0,0.02)]">
            <LightbulbIcon className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-zinc-700 leading-relaxed">{suggestion}</p>
          </div>
        </div>
      </div>
    </motion.div>
);

export const EvaluationScreen = ({ analysis }) => {
  // Map the scores with their corresponding icons
  const scoresWithIcons = analysis.scores.map(score => ({
    ...score,
    icon: categoryIcons[score.category] || Sparkles // Sparkles as fallback icon
  }));

  return (
    <div className="h-full w-full bg-gradient-to-br from-white via-zinc-50/90 to-zinc-100/80">
      <div className="max-w-7xl mx-auto p-8 h-full flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-violet-500 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to personas
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl text-zinc-900 ml-4">
            Performance Analysis
          </h1>
        </motion.div>

        <div className="flex-1 overflow-y-auto space-y-12 min-h-0">
          {/* Scores Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scoresWithIcons.map((score, index) => (
              <ScoreCard 
                key={index}
                icon={score.icon}
                category={score.category}
                score={score.score}
                description={score.description}
              />
            ))}
          </div>

          {/* Feedback Section */}
          <div>
            <h2 className="text-2xl font-serif text-zinc-800 mb-6 ml-4">
              Conversation Insights
            </h2>
            <div className="space-y-4">
              {analysis.insights.map((item, index) => (
                <FeedbackItem 
                  key={index}
                  message={item.message}
                  suggestion={item.suggestion}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-violet-100/20 via-blue-100/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-amber-100/20 via-purple-100/10 to-transparent rounded-full blur-3xl" />
      </div>
    </div>
  );
};