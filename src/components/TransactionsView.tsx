import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Calendar, Tag, X, ChevronDown, Wallet } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../utils/cn';
import type { Transaction, Account } from '../types';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  className?: string;
}

type TypeFilter = 'all' | 'income' | 'expense';

export function TransactionsView({ transactions, accounts, className }: TransactionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(() => {
    const cats = [...new Set(transactions.map(t => t.category))];
    return ['all', ...cats.sort()];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    if (accountFilter !== 'all') {
      filtered = filtered.filter(t => t.accountId === accountFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.merchant?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, typeFilter, categoryFilter, accountFilter, searchQuery]);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

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

  const getAccountName = (accountId?: string) => {
    if (!accountId) return null;
    return accounts.find(a => a.id === accountId)?.name || null;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setAccountFilter('all');
  };

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' || accountFilter !== 'all';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <p className="text-sm text-cream-400/60 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-cream-400">{filteredTransactions.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card"
        >
          <p className="text-sm text-cream-400/60 mb-1">Income</p>
          <p className="text-2xl font-bold text-cream-400">{formatCurrency(totalIncome)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <p className="text-sm text-cream-400/60 mb-1">Expenses</p>
          <p className="text-2xl font-bold text-cream-300">{formatCurrency(totalExpenses)}</p>
        </motion.div>
      </div>

      {/* Search and filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cream-400/40" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-theme-800 border border-theme-700 rounded-xl pl-12 pr-4 py-3 text-cream-400 placeholder-cream-400/30 focus:outline-none focus:border-highlight-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cream-400/40 hover:text-cream-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl border transition-all',
              showFilters
                ? 'bg-highlight-500/20 border-highlight-500 text-cream-400'
                : 'bg-theme-800 border-theme-700 text-cream-400/60 hover:border-highlight-500 hover:text-cream-400'
            )}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-cream-400" />
            )}
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-theme-800 border border-theme-700 space-y-4">
                {/* Type filter */}
                <div>
                  <p className="text-sm text-cream-400/60 mb-2">Type</p>
                  <div className="flex gap-2">
                    {(['all', 'income', 'expense'] as TypeFilter[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setTypeFilter(type)}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                          typeFilter === type
                            ? 'bg-highlight-500 text-cream-400'
                            : 'bg-theme-700 text-cream-400/60 hover:text-cream-400'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div>
                  <p className="text-sm text-cream-400/60 mb-2">Category</p>
                  <div className="relative">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-theme-700 border border-theme-600 rounded-lg px-4 py-2.5 text-cream-400 text-sm appearance-none focus:outline-none focus:border-highlight-500 capitalize"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-theme-800 capitalize">
                          {cat === 'all' ? 'All Categories' : cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40 pointer-events-none" />
                  </div>
                </div>

                {/* Account filter */}
                <div>
                  <p className="text-sm text-cream-400/60 mb-2">Account</p>
                  <div className="relative">
                    <select
                      value={accountFilter}
                      onChange={(e) => setAccountFilter(e.target.value)}
                      className="w-full bg-theme-700 border border-theme-600 rounded-lg px-4 py-2.5 text-cream-400 text-sm appearance-none focus:outline-none focus:border-highlight-500"
                    >
                      <option value="all" className="bg-theme-800">All Accounts</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id} className="bg-theme-800">
                          {acc.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400/40 pointer-events-none" />
                  </div>
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-cream-400/60 hover:text-cream-400 underline underline-offset-2"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Transactions list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-700 flex items-center justify-center">
                  <Search className="w-8 h-8 text-highlight-500" />
                </div>
                <p className="text-cream-400/60">No transactions found</p>
                <p className="text-highlight-500 text-sm mt-1">
                  Try adjusting your search or filters
                </p>
              </motion.div>
            ) : (
              filteredTransactions.map((transaction, index) => {
                const accountName = getAccountName(transaction.accountId);
                return (
                  <motion.div
                    key={transaction.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                    className="group relative overflow-hidden rounded-xl bg-theme-800/50 border border-theme-700 p-4 hover:border-highlight-400 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
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
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                              getCategoryColor(transaction.category)
                            )}
                          >
                            <Tag className="w-3 h-3" />
                            {transaction.category}
                          </span>

                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(transaction.date)}
                          </span>

                          {accountName && (
                            <span className="flex items-center gap-1 text-cream-400/40">
                              <Wallet className="w-3 h-3" />
                              {accountName}
                            </span>
                          )}

                          {transaction.isRecurring && (
                            <span className="text-cream-400/60">
                              {transaction.recurrence}
                            </span>
                          )}
                        </div>

                        {transaction.description && (
                          <p className="text-highlight-500 text-xs mt-2 line-clamp-1">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
