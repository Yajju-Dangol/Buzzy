import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn, formatCurrency } from '../utils/cn';
import type { Transaction } from '../types';

interface AnalyticsViewProps {
  transactions: Transaction[];
  className?: string;
}

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#6366F1', '#F97316', '#22C55E', '#14B8A6'];

export function AnalyticsView({ transactions, className }: AnalyticsViewProps) {
  const {
    totalIncome,
    totalExpenses,
    avgIncome,
    avgExpenses,
    savingsRate,
    spendingByCategory,
    weeklyData,
    monthlySavings,
  } = useMemo(() => {
    const incomeTx = transactions.filter(t => t.type === 'income');
    const expenseTx = transactions.filter(t => t.type === 'expense');

    const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTx.reduce((sum, t) => sum + t.amount, 0);
    const avgIncome = incomeTx.length > 0 ? totalIncome / incomeTx.length : 0;
    const avgExpenses = expenseTx.length > 0 ? totalExpenses / expenseTx.length : 0;
    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;

    const categoryMap = new Map<string, number>();
    expenseTx.forEach(t => {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
    });
    const spendingByCategory = Array.from(categoryMap.entries())
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekMap = new Map<number, { income: number; expenses: number }>();
    daysOfWeek.forEach((_, i) => weekMap.set(i, { income: 0, expenses: 0 }));
    transactions.forEach(t => {
      const day = new Date(t.date).getDay();
      const entry = weekMap.get(day) || { income: 0, expenses: 0 };
      if (t.type === 'income') entry.income += t.amount;
      else entry.expenses += t.amount;
    });
    const weeklyData = daysOfWeek.map((name, i) => ({
      name,
      ...weekMap.get(i),
    }));

    const monthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('en', { month: 'short' });
      monthMap.set(key, 0);
    }
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = d.toLocaleString('en', { month: 'short' });
      if (monthMap.has(key) && t.type === 'income') {
        const expForMonth = expenseTx
          .filter(e => new Date(e.date).getMonth() === d.getMonth() && new Date(e.date).getFullYear() === d.getFullYear())
          .reduce((s, e) => s + e.amount, 0);
        monthMap.set(key, (monthMap.get(key) || 0) + (t.amount - expForMonth));
      }
    });
    const monthlySavings = Array.from(monthMap.entries()).map(([month, amount]) => ({ month, amount }));

    return {
      totalIncome,
      totalExpenses,
      avgIncome,
      avgExpenses,
      savingsRate,
      spendingByCategory,
      weeklyData,
      monthlySavings,
    };
  }, [transactions]);

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cream-400/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cream-400" />
            </div>
            <div>
              <p className="text-sm text-cream-400/60">Total Income</p>
              <p className="text-2xl font-bold text-cream-400">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          {avgIncome > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-cream-400/20 text-cream-400">
                Avg {formatCurrency(avgIncome)}
              </span>
              <span className="text-xs text-highlight-500">per transaction</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-highlight-500/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-highlight-500" />
            </div>
            <div>
              <p className="text-sm text-cream-400/60">Total Expenses</p>
              <p className="text-2xl font-bold text-highlight-500">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
          {avgExpenses > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-highlight-500/20 text-highlight-500">
                Avg {formatCurrency(avgExpenses)}
              </span>
              <span className="text-xs text-highlight-500">per transaction</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-400/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <p className="text-sm text-cream-400/60">Savings Rate</p>
              <p className="text-2xl font-bold text-accent-400">{(savingsRate * 100).toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-highlight-500">
              {transactions.length} transactions tracked
            </span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-cream-400 mb-4">
            Weekly Income vs Expenses
          </h3>
          {transactions.length === 0 ? (
            <p className="text-cream-400/60 text-center py-12">No data yet. Start talking about your finances!</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#393E46" />
                  <XAxis dataKey="name" stroke="#DFD0B8" fontSize={12} />
                  <YAxis stroke="#DFD0B8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#222831',
                      border: '1px solid #393E46',
                      borderRadius: '12px',
                      color: '#DFD0B8',
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), '']}
                  />
                  <Bar dataKey="income" fill="#DFD0B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#393E46" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-cream-400 mb-4">
            Spending by Category
          </h3>
          {spendingByCategory.length === 0 ? (
            <p className="text-cream-400/60 text-center py-12">No expenses recorded yet</p>
          ) : (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {spendingByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#222831',
                        border: '1px solid #393E46',
                        borderRadius: '12px',
                        color: '#DFD0B8',
                      }}
                      formatter={(value) => [formatCurrency(Number(value)), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {spendingByCategory.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-cream-400/60 capitalize">{item.name}</span>
                    <span className="text-xs text-cream-300 ml-auto">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-cream-400 mb-4">
            Savings Trend
          </h3>
          {monthlySavings.length === 0 ? (
            <p className="text-cream-400/60 text-center py-12">No data yet</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySavings}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DFD0B8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#DFD0B8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#393E46" />
                  <XAxis dataKey="month" stroke="#DFD0B8" fontSize={12} />
                  <YAxis stroke="#DFD0B8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#222831',
                      border: '1px solid #393E46',
                      borderRadius: '12px',
                      color: '#DFD0B8',
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#DFD0B8"
                    fillOpacity={1}
                    fill="url(#colorSavings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
