import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { ErrorPopup } from './ErrorPopup';


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

// confirm the types of analysis and transcript
export const DownloadButton = ({ analysis, transcript }: { analysis: Analysis, transcript: string }) => {
    const [showError, setShowError] = useState(false);
    const handleDownload = async () => {
        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                analysis,
                transcript
                }),
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sales-evaluation-${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                setShowError(true);
            }
        } catch (error) {
            setShowError(true);
        }
    };

    return (
        <>
            <ErrorPopup 
                isVisible={showError} 
                onClose={() => setShowError(false)}
                message="Error downloading PDF."
            />
            <motion.button
                onClick={handleDownload}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 2 }}
                className="
                    inline-flex items-center gap-2 px-4 py-2
                    rounded-xl bg-zinc-900/5 
                    text-zinc-600 text-sm font-medium
                    border border-zinc-300/20
                    shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04),0_2px_12px_-8px_rgba(0,0,0,0.02)]
                    hover:bg-zinc-900/10 
                    hover:shadow-[0_4px_12px_-6px_rgba(0,0,0,0.08),0_4px_16px_-10px_rgba(0,0,0,0.06)]
                    transition-all duration-300 ease-out
                "
            >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
            </motion.button>
        </>
    );
};

export default DownloadButton;