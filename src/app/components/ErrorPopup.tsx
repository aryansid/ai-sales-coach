import { motion, AnimatePresence } from 'framer-motion';
import { XCircle } from 'lucide-react';

interface ErrorPopupProps {
  isVisible: boolean;
  onClose: () => void;
  message: string;
}

export const ErrorPopup = ({ isVisible, onClose, message }: ErrorPopupProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900">
                {message || "Something went wrong"}
              </h3>
              <p className="text-zinc-600">
                There was an issue. Please contact the admin team.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
