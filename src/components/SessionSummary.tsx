import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Check, Edit2, Volume2 } from 'lucide-react';
import { formatCurrency } from '../utils/cn';
import type { Session } from '../types';

interface SessionSummaryProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onEdit?: () => void;
}

export function SessionSummary({
  session,
  isOpen,
  onClose,
  onConfirm,
  onEdit,
}: SessionSummaryProps) {
  if (!session) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-theme-800 to-theme-900 border border-theme-700 shadow-2xl">
                {/* Header gradient */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-highlight-500/10 to-transparent" />

                {/* Content */}
                <div className="relative p-6">
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-theme-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-cream-400/60" />
                  </button>

                  {/* Title */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-highlight-500 to-highlight-600 flex items-center justify-center">
                      <Volume2 className="w-6 h-6 text-cream-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-cream-400">
                        Session Summary
                      </h2>
                      <p className="text-sm text-highlight-500">
                        {new Date(session.startedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="rounded-2xl bg-theme-700/50 p-4 border border-highlight-500">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-cream-400" />
                        <span className="text-xs text-cream-400/60">Income</span>
                      </div>
                      <div className="text-xl font-bold text-cream-400">
                        {formatCurrency(session.totalIncome)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-theme-700/50 p-4 border border-highlight-500">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-highlight-500" />
                        <span className="text-xs text-cream-400/60">Expenses</span>
                      </div>
                      <div className="text-xl font-bold text-highlight-500">
                        {formatCurrency(session.totalExpenses)}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
<span className="text-cream-400/60">Duration</span>
                    <span className="text-cream-400 font-medium">
                        {Math.floor(session.duration / 60)}m {session.duration % 60}s
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
<span className="text-cream-400/60">Transactions</span>
                    <span className="text-cream-400 font-medium">
                        {session.transactionsCount} logged
                      </span>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {session.summary && (
                    <div className="mb-6 p-4 rounded-xl bg-theme-700/50 border border-highlight-500">
                      <p className="text-sm text-cream-300 leading-relaxed">
                        {session.summary}
                      </p>
                    </div>
                  )}

                  {/* Audio playback mockup */}
                  <div className="mb-6 p-4 rounded-xl bg-theme-700/30 border border-highlight-500">
                    <div className="flex items-center gap-3">
                      <button className="w-10 h-10 rounded-full bg-highlight-500 hover:bg-highlight-600 flex items-center justify-center transition-colors">
                        <Play className="w-4 h-4 text-cream-400 ml-0.5" />
                      </button>
                      <div className="flex-1">
                        <div className="h-8 flex items-center gap-0.5">
                          {[...Array(40)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 bg-highlight-500/50 rounded-full"
                              style={{
                                height: `${20 + Math.random() * 60}%`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {onEdit && (
                      <button
                        onClick={onEdit}
                        className="flex-1 py-3 px-4 rounded-xl bg-theme-700 hover:bg-highlight-500 text-cream-400 font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    {onConfirm ? (
                      <button
                        onClick={onConfirm}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-highlight-600 to-highlight-500 hover:from-highlight-500 hover:to-highlight-500 text-cream-400 font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/50"
                      >
                        <Check className="w-4 h-4" />
                        Confirm
                      </button>
                    ) : (
                      <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-highlight-600 to-highlight-500 hover:from-highlight-500 hover:to-highlight-500 text-cream-400 font-medium transition-all shadow-lg shadow-black/50"
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
