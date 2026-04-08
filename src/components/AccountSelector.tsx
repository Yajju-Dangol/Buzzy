import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Wallet, ChevronUp } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Account } from '../types';

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountId: string;
  onSelect: (accountId: string) => void;
  className?: string;
}

const getAccountIcon = (type: Account['type']) => {
  switch (type) {
    case 'checking': return Wallet;
    case 'savings': return Wallet;
    case 'credit_card': return Wallet;
    case 'cash': return Wallet;
    case 'investment': return Wallet;
    case 'loan': return Wallet;
    case 'ewallet': return Wallet;
    default: return Wallet;
  }
};

export function AccountSelector({ accounts, selectedAccountId, onSelect, className }: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = accounts.find(a => a.id === selectedAccountId);
  const Icon = selected ? getAccountIcon(selected.type) : Wallet;

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-theme-800 border border-theme-700 hover:border-highlight-500 transition-all text-sm"
      >
        <Icon className="w-4 h-4 text-cream-400/60" />
        <span className="text-cream-400 font-medium truncate max-w-32">{selected?.name || 'Select Account'}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-cream-400/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-cream-400/40" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-0 right-0 z-50 min-w-64 rounded-xl bg-theme-800 border border-theme-700 shadow-2xl overflow-hidden"
            >
              <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                {accounts.map((account) => {
                  const AccIcon = getAccountIcon(account.type);
                  return (
                    <button
                      key={account.id}
                      onClick={() => {
                        onSelect(account.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left',
                        selectedAccountId === account.id
                          ? 'bg-highlight-500/20 text-cream-400'
                          : 'text-cream-400/60 hover:bg-theme-700 hover:text-cream-400'
                      )}
                    >
                      <AccIcon className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{account.name}</p>
                        <p className="text-xs text-cream-400/40 capitalize">{account.type.replace('_', ' ')}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
