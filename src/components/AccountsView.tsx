import { motion } from 'framer-motion';
import {
  Wallet, CreditCard, PiggyBank, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { cn, formatCurrency } from '../utils/cn';
import type { Account } from '../types';

interface AccountsViewProps {
  accounts: Account[];
  className?: string;
}

export function AccountsView({ accounts, className }: AccountsViewProps) {
  const totalAssets = accounts
    .filter(a => a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter(a => a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const netWorth = totalAssets - totalLiabilities;

  const getAccountIcon = (type: Account['type']) => {
    switch (type) {
      case 'checking': return Wallet;
      case 'savings': return PiggyBank;
      case 'credit_card': return CreditCard;
      case 'cash': return DollarSign;
      case 'investment': return TrendingUp;
      case 'loan': return ArrowDownRight;
      case 'ewallet': return Wallet;
      default: return Wallet;
    }
  };

  const getAccountColor = (type: Account['type']) => {
    switch (type) {
      case 'checking': return 'from-accent-400 to-accent-400';
      case 'savings': return 'from-cream-400 to-cream-400';
      case 'credit_card': return 'from-cream-400/70 to-cream-400/70';
      case 'cash': return 'from-accent-500 to-accent-500';
      case 'investment': return 'from-accent-400 to-accent-400';
      case 'loan': return 'from-highlight-500 to-highlight-500';
      case 'ewallet': return 'from-accent-500 to-accent-500';
      default: return 'from-highlight-500 to-highlight-500';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <p className="text-sm text-cream-400/60 mb-1">Total Assets</p>
          <p className="text-3xl font-bold text-cream-400">{formatCurrency(totalAssets)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <p className="text-sm text-cream-400/60 mb-1">Total Liabilities</p>
          <p className="text-3xl font-bold text-highlight-500">{formatCurrency(totalLiabilities)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <p className="text-sm text-cream-400/60 mb-1">Net Worth</p>
          <p className={cn(
            'text-3xl font-bold',
            netWorth >= 0 ? 'text-cream-400' : 'text-highlight-500'
          )}>
            {formatCurrency(netWorth)}
          </p>
        </motion.div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-cream-400 mb-4">Your Accounts</h3>
        {accounts.length === 0 ? (
          <div className="text-center py-12 card">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-700 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-highlight-500" />
            </div>
            <p className="text-cream-400/60">No accounts yet</p>
            <p className="text-highlight-500 text-sm mt-1">
              Accounts are created automatically when you log transactions
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account, index) => {
              const Icon = getAccountIcon(account.type);
              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl bg-theme-800/50 border border-theme-700 p-5 hover:border-highlight-400 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                      getAccountColor(account.type)
                    )}>
                      <Icon className="w-6 h-6 text-cream-400" />
                    </div>
                    <span className="text-xs text-highlight-500 capitalize">
                      {account.type.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="font-medium text-cream-400 mb-1">{account.name}</h4>
                  <p className={cn(
                    'text-2xl font-bold',
                    account.balance >= 0 ? 'text-cream-400' : 'text-highlight-500'
                  )}>
                    {formatCurrency(account.balance)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-cream-400 mb-4">Recent Activity</h3>
        <div className="card">
          <p className="text-cream-400/60 text-sm text-center py-8">
            View all transactions in the Transactions tab
          </p>
        </div>
      </div>
    </div>
  );
}
