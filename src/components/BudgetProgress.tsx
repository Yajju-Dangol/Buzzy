import { motion } from 'framer-motion';
import { cn, formatCurrency } from '../utils/cn';
import type { Budget } from '../types';

interface BudgetProgressProps {
  budgets: Budget[];
  className?: string;
}

export function BudgetProgress({ budgets, className }: BudgetProgressProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'from-highlight-500 to-highlight-600';
    if (percentage >= 80) return 'from-accent-500 to-accent-500';
    if (percentage >= 50) return 'from-accent-400 to-accent-400';
    return 'from-cream-400 to-cream-400';
  };

  const getBarColor = (percentage: number) => {
    if (percentage >= 100) return 'text-highlight-500';
    if (percentage >= 80) return 'text-accent-500';
    if (percentage >= 50) return 'text-accent-400';
    return 'text-cream-400';
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-cream-400 mb-4">Budget Progress</h3>
      
      <div className="space-y-4">
        {budgets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-cream-400/60">No budgets set</p>
            <p className="text-highlight-500 text-sm mt-1">
              Tell the AI about your budget goals
            </p>
          </div>
        ) : (
          budgets.map((budget) => {
            const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
            const remaining = budget.amount - budget.spent;
            
            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-cream-400 capitalize">
                      {budget.category}
                    </span>
                    <span className="text-xs text-highlight-500 capitalize">
                      ({budget.period})
                    </span>
                  </div>
                  <span className={cn('text-sm font-semibold', getBarColor(percentage))}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative h-3 rounded-full bg-theme-700 overflow-hidden">
                  <motion.div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-500',
                      getProgressColor(percentage)
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>

                {/* Details */}
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-highlight-500">
                    {percentage.toFixed(0)}% used
                  </span>
                  <span
                    className={cn(
                      remaining < 0 ? 'text-highlight-500' : 'text-cream-400/60'
                    )}
                  >
                    {remaining >= 0
                      ? `${formatCurrency(remaining)} remaining`
                      : `${formatCurrency(Math.abs(remaining))} over budget`}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
