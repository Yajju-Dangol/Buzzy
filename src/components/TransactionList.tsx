import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Calendar, Tag, Store } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../utils/cn';
import type { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  className?: string;
}

export function TransactionList({ transactions, className }: TransactionListProps) {
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      salary: 'bg-cream-400/20 text-cream-400',
      freelance: 'bg-accent-400/20 text-accent-400',
      groceries: 'bg-accent-500/20 text-accent-500',
      dining: 'bg-accent-500/20 text-accent-500',
      transportation: 'bg-cream-400/70 text-cream-400/70',
      rent: 'bg-highlight-500/20 text-highlight-500',
      utilities: 'bg-accent-500/20 text-accent-500',
      entertainment: 'bg-accent-400/20 text-accent-400',
      subscriptions: 'bg-accent-400/20 text-accent-400',
      shopping: 'bg-highlight-500/20 text-highlight-500',
    };
    return colors[category.toLowerCase()] || 'bg-highlight-400 text-cream-300';
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cream-400">Recent Transactions</h3>
        <span className="text-sm text-highlight-500">
          {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTransactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-700 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-highlight-500" />
              </div>
              <p className="text-cream-400/60">No transactions yet</p>
              <p className="text-highlight-500 text-sm mt-1">
                Start by talking about your finances
              </p>
            </motion.div>
          ) : (
            sortedTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="group relative overflow-hidden rounded-xl bg-theme-800/50 border border-theme-700 p-4 hover:border-highlight-400 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                      transaction.type === 'income'
                        ? 'bg-cream-400/20'
                        : 'bg-theme-700'
                    )}
                  >
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="w-6 h-6 text-cream-400" />
                    ) : (
                      <ArrowDownRight className="w-6 h-6 text-cream-300" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-medium text-cream-400 truncate">
                        {transaction.merchant || transaction.category}
                      </h4>
                      <span
                        className={cn(
                          'font-bold whitespace-nowrap',
                          transaction.type === 'income'
                            ? 'text-cream-400'
                            : 'text-cream-400'
                        )}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-highlight-500">
                      {/* Category badge */}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                          getCategoryColor(transaction.category)
                        )}
                      >
                        <Tag className="w-3 h-3" />
                        {transaction.category}
                      </span>

                      {/* Date */}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(transaction.date)}
                      </span>

                      {/* Recurring indicator */}
                      {transaction.isRecurring && (
                        <span className="text-cream-400/60">
                          • {transaction.recurrence}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {transaction.description && (
                      <p className="text-highlight-500 text-xs mt-2 line-clamp-1">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


