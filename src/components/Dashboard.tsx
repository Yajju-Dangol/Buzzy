import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, PiggyBank, PlayCircle, Loader2, Volume2, Link2, Unlink } from 'lucide-react';
import { StatCard } from './StatCard';
import { TransactionList } from './TransactionList';
import { BudgetProgress } from './BudgetProgress';
import { FinancialGoals } from './FinancialGoals';
import { SubscriptionsList } from './SubscriptionsList';
import { cn } from '../utils/cn';
import type { DashboardData } from '../types';
import { generateWeeklySummary, generateTTSAudio } from '../services/gemini';
import { getTransactionsByDateRange, getActiveAiMemories } from '../services/database';

declare const puter: any;

interface DashboardProps {
  data: DashboardData;
  className?: string;
}

export function Dashboard({ data, className }: DashboardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPuterSignedIn, setIsPuterSignedIn] = useState(false);

  useEffect(() => {
    // Check initial Puter sign-in status
    const checkStatus = () => {
      if (typeof puter !== 'undefined' && puter.auth) {
        setIsPuterSignedIn(puter.auth.isSignedIn());
      }
    };
    
    checkStatus();
    // Poll occasionally as Puter's internal state might change via popups
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePuterSignIn = async () => {
    try {
      await puter.auth.signIn();
      setIsPuterSignedIn(true);
    } catch (err) {
      console.error('Puter sign-in failed:', err);
    }
  };

  const handlePuterSignOut = () => {
    puter.auth.signOut();
    setIsPuterSignedIn(false);
  };

  const { totalIncome, totalExpenses, netSavings, savingsRate } = data;

  const playWeeklySummary = async () => {
    try {
      setIsLoadingAudio(true);
      
      const now = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      
      const startDate = oneWeekAgo.toISOString();
      const endDate = now.toISOString();

      const [recentTx, aiMemories] = await Promise.all([
        getTransactionsByDateRange(startDate, endDate),
        getActiveAiMemories(20)
      ]);

      const summaryText = await generateWeeklySummary(recentTx, aiMemories);
      const audioBlob = await generateTTSAudio(summaryText);
      const url = URL.createObjectURL(audioBlob);
      
      setAudioUrl(url);
      
      const audio = new Audio(url);
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      await audio.play();

    } catch (err) {
      console.error('Error playing weekly summary:', err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-theme-900 to-theme-700 bg-clip-text text-transparent">Overview</h2>
          
          {isPuterSignedIn ? (
            <div className="flex items-center gap-2">
              <div className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center gap-2 font-medium">
                <div className="w-2 h-2 rounded-full animate-pulse bg-green-500" />
                Connected to Puter
              </div>
              <button
                onClick={handlePuterSignOut}
                className="p-1.5 text-theme-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Disconnect Puter"
              >
                <Unlink className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handlePuterSignIn}
              className="text-xs px-3 py-1.5 bg-theme-100 hover:bg-theme-200 text-theme-700 rounded-lg transition-colors border border-theme-200 flex items-center gap-2 font-medium"
            >
              <div className="w-2 h-2 rounded-full animate-pulse bg-highlight-500" />
              Login with Puter for voice commands
            </button>
          )}
        </div>
        <button
          onClick={playWeeklySummary}
          disabled={isLoadingAudio || isPlaying}
          className="flex items-center gap-2 px-4 py-2 bg-highlight-500 hover:bg-highlight-400 text-cream-400 rounded-xl transition-all shadow-md shadow-highlight-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingAudio ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <PlayCircle className="w-5 h-5" />
          )}
          <span className="font-semibold text-sm">Play Weekly Summary</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={totalIncome}
          type="income"
          change={12.5}
          changeLabel="vs last month"
          icon={<TrendingUp className="w-5 h-5 text-cream-400" />}
        />
        <StatCard
          title="Total Expenses"
          value={totalExpenses}
          type="expense"
          change={-5.2}
          changeLabel="vs last month"
        />
        <StatCard
          title="Net Savings"
          value={netSavings}
          type={netSavings >= 0 ? 'savings' : 'expense'}
          change={netSavings >= 0 ? 8.3 : -12.1}
          changeLabel="vs last month"
          icon={<Wallet className="w-5 h-5 text-accent-400" />}
        />
        <StatCard
          title="Savings Rate"
          value={savingsRate}
          type="neutral"
          change={2.1}
          changeLabel="vs last month"
          icon={<PiggyBank className="w-5 h-5 text-cream-400/70" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="card"
          >
            <TransactionList transactions={data.transactions} />
          </motion.div>

          {/* Budget Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card"
          >
            <BudgetProgress budgets={data.budgets} />
          </motion.div>
        </div>

        {/* Right Column - Goals & Subscriptions */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card"
          >
            <FinancialGoals goals={data.goals} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card"
          >
            <SubscriptionsList subscriptions={data.subscriptions} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
