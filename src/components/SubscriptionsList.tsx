import { motion } from 'framer-motion';
import { Calendar, Repeat } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../utils/cn';
import type { Subscription } from '../types';

interface SubscriptionsListProps {
  subscriptions: Subscription[];
  className?: string;
}

export function SubscriptionsList({ subscriptions, className }: SubscriptionsListProps) {
  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      streaming: 'from-cream-400/70 to-accent-500',
      software: 'from-accent-400 to-accent-400',
      gym: 'from-accent-500 to-highlight-500',
      news: 'from-accent-500 to-accent-500',
      cloud_storage: 'from-accent-400 to-cream-400/70',
      music: 'from-accent-500 to-highlight-500',
      gaming: 'from-cream-400 to-cream-400',
    };
    return colors[category || 'other'] || 'from-highlight-500 to-highlight-400';
  };

  const activeSubscriptions = subscriptions.filter(s => s.isActive);
  const totalMonthly = activeSubscriptions.reduce((sum, sub) => {
    const multiplier = {
      weekly: 4.33,
      monthly: 1,
      quarterly: 1/3,
      annually: 1/12,
    }[sub.billingCycle];
    return sum + (sub.amount * multiplier);
  }, 0);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cream-400">Subscriptions</h3>
        <div className="text-right">
          <div className="text-xs text-highlight-500">Monthly total</div>
          <div className="text-sm font-bold text-cream-400">
            {formatCurrency(totalMonthly)}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {subscriptions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-700 flex items-center justify-center">
              <Repeat className="w-8 h-8 text-highlight-500" />
            </div>
            <p className="text-cream-400/60">No subscriptions tracked</p>
            <p className="text-highlight-500 text-sm mt-1">
              Mention your subscriptions to track them
            </p>
          </div>
        ) : (
          activeSubscriptions.map((sub) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="group relative overflow-hidden rounded-xl bg-theme-800/50 border border-theme-700 p-4 hover:border-highlight-400 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                    getCategoryColor(sub.category)
                  )}
                >
                  <span className="text-cream-400 font-bold text-lg">
                    {sub.serviceName.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-cream-400">{sub.serviceName}</h4>
                    <span className="font-bold text-cream-400">
                      {formatCurrency(sub.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-highlight-500">
                    {/* Billing cycle */}
                    <span className="flex items-center gap-1 capitalize">
                      <Repeat className="w-3 h-3" />
                      {sub.billingCycle}
                    </span>

                    {/* Next billing date */}
                    {sub.nextBillingDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Next: {formatDate(sub.nextBillingDate)}
                      </span>
                    )}

                    {/* Category */}
                    {sub.category && (
                      <span className="capitalize">{sub.category}</span>
                    )}
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-cream-400" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
