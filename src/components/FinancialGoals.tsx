import { motion } from 'framer-motion';
import { Target, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { cn, formatCurrency } from '../utils/cn';
import type { FinancialGoal } from '../types';

interface FinancialGoalsProps {
  goals: FinancialGoal[];
  className?: string;
}

export function FinancialGoals({ goals, className }: FinancialGoalsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'from-highlight-500 to-highlight-600';
      case 'medium':
        return 'from-accent-500 to-accent-500';
      case 'low':
        return 'from-accent-400 to-accent-400';
      default:
        return 'from-highlight-500 to-highlight-400';
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-highlight-500';
      case 'medium':
        return 'bg-accent-500';
      case 'low':
        return 'bg-accent-400';
      default:
        return 'bg-highlight-500';
    }
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-cream-400 mb-4">Financial Goals</h3>
      
      <div className="grid gap-4">
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-700 flex items-center justify-center">
              <Target className="w-8 h-8 text-highlight-500" />
            </div>
            <p className="text-cream-400/60">No goals yet</p>
            <p className="text-highlight-500 text-sm mt-1">
              Tell the AI about your savings goals
            </p>
          </div>
        ) : (
          goals.map((goal) => {
            const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const remaining = goal.targetAmount - goal.currentAmount;
            const monthsLeft = goal.targetDate
              ? Math.ceil(
                  (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
                )
              : null;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative overflow-hidden rounded-2xl bg-theme-800/50 border border-theme-700 p-5 hover:border-highlight-400 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        `bg-gradient-to-br ${getPriorityColor(goal.priority)}`
                      )}
                    >
                      <Target className="w-6 h-6 text-cream-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-cream-400">{goal.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={cn('w-2 h-2 rounded-full', getPriorityDot(goal.priority))}
                        />
                        <span className="text-xs text-highlight-500 capitalize">
                          {goal.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress ring alternative - linear progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-cream-400">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-sm text-highlight-500">
                      of {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  
                  <div className="relative h-2 rounded-full bg-theme-700 overflow-hidden">
                    <motion.div
                      className={cn(
                        'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700',
                        getPriorityColor(goal.priority)
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-cream-400/60">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <div>
                      <div className="text-highlight-500">Progress</div>
                      <div className="font-medium text-cream-300">
                        {percentage.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-cream-400/60">
                    <DollarSign className="w-3.5 h-3.5" />
                    <div>
                      <div className="text-highlight-500">Monthly</div>
                      <div className="font-medium text-cream-300">
                        {goal.monthlyContribution
                          ? formatCurrency(goal.monthlyContribution)
                          : '-'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-cream-400/60">
                    <Calendar className="w-3.5 h-3.5" />
                    <div>
                      <div className="text-highlight-500">Time left</div>
                      <div className="font-medium text-cream-300">
                        {monthsLeft !== null && monthsLeft > 0
                          ? `${monthsLeft} months`
                          : goal.targetDate
                          ? 'Achieved!'
                          : '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remaining amount */}
                <div className="mt-4 pt-4 border-t border-theme-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-highlight-500">Remaining</span>
                    <span
                      className={cn(
                        'font-semibold',
                        remaining <= 0 ? 'text-cream-400' : 'text-cream-300'
                      )}
                    >
                      {remaining > 0 ? formatCurrency(remaining) : 'Goal achieved!'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
