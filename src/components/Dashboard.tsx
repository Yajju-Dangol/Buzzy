import { motion } from 'framer-motion';
import { Wallet, TrendingUp, PiggyBank } from 'lucide-react';
import { StatCard } from './StatCard';
import { TransactionList } from './TransactionList';
import { BudgetProgress } from './BudgetProgress';
import { FinancialGoals } from './FinancialGoals';
import { SubscriptionsList } from './SubscriptionsList';
import { cn } from '../utils/cn';
import type { DashboardData } from '../types';

interface DashboardProps {
  data: DashboardData;
  className?: string;
}

export function Dashboard({ data, className }: DashboardProps) {
  const { totalIncome, totalExpenses, netSavings, savingsRate } = data;

  return (
    <div className={cn('space-y-6', className)}>
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
