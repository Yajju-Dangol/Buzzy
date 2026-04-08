import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn, formatCurrency } from '../utils/cn';

interface StatCardProps {
  title: string;
  value: number;
  type: 'income' | 'expense' | 'savings' | 'neutral';
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  type,
  change,
  changeLabel,
  icon,
  className,
}: StatCardProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'income':
        return {
          gradient: 'from-cream-400/20 to-cream-400/5',
          textColor: 'text-cream-400',
          iconBg: 'bg-cream-400/20',
          iconColor: 'text-cream-400',
        };
      case 'expense':
        return {
          gradient: 'from-highlight-500/20 to-highlight-500/5',
          textColor: 'text-highlight-500',
          iconBg: 'bg-highlight-500/20',
          iconColor: 'text-highlight-500',
        };
      case 'savings':
        return {
          gradient: 'from-accent-400/20 to-accent-400/5',
          textColor: 'text-accent-400',
          iconBg: 'bg-accent-400/20',
          iconColor: 'text-accent-400',
        };
      default:
        return {
          gradient: 'from-highlight-500 to-theme-700',
          textColor: 'text-cream-400',
          iconBg: 'bg-highlight-400',
          iconColor: 'text-cream-300',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 transition-all duration-300',
'bg-gradient-to-br border border-theme-700',
'hover:border-highlight-400 hover:shadow-lg',
        className
      )}
      whileHover={{ y: -2 }}
    >
      {/* Background gradient */}
      <div className={cn('absolute inset-0 opacity-50', styles.gradient)} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-cream-400/60 text-sm font-medium">{title}</span>
          <div className={cn('p-2 rounded-lg', styles.iconBg)}>
            {icon ? (
              icon
            ) : type === 'income' ? (
              <TrendingUp className={cn('w-5 h-5', styles.iconColor)} />
            ) : type === 'expense' ? (
              <TrendingDown className={cn('w-5 h-5', styles.iconColor)} />
            ) : (
              <DollarSign className={cn('w-5 h-5', styles.iconColor)} />
            )}
          </div>
        </div>

        {/* Value */}
        <div className="mb-2">
          <motion.span
            className={cn('text-3xl font-bold', styles.textColor)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {formatCurrency(value)}
          </motion.span>
        </div>

        {/* Change indicator */}
        {(change !== undefined) && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-xs font-semibold px-2 py-1 rounded-full',
                change >= 0
                  ? 'bg-cream-400/20 text-cream-400'
                  : 'bg-highlight-500/20 text-highlight-500'
              )}
            >
              {change >= 0 ? '+' : ''}{change?.toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="text-highlight-500 text-xs">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
