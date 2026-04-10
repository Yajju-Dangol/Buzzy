import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, PiggyBank, PlayCircle, Loader2, Volume2 } from 'lucide-react';
import { StatCard } from './StatCard';
import { TransactionList } from './TransactionList';
import { BudgetProgress } from './BudgetProgress';
import { FinancialGoals } from './FinancialGoals';
import { SubscriptionsList } from './SubscriptionsList';
import { cn } from '../utils/cn';
import type { DashboardData } from '../types';
import { generateWeeklySummary, generateTTSAudio } from '../services/gemini';
// Removed ElevenLabs TTS import
import { getTransactionsByDateRange, getActiveAiMemories } from '../services/database';

interface DashboardProps {
  data: DashboardData;
  className?: string;
}

export function Dashboard({ data, className }: DashboardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-theme-900 to-theme-700 bg-clip-text text-transparent">Overview</h2>
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
