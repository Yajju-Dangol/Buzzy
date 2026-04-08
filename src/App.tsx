import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, LayoutDashboard, PieChart, List,
  Menu, X, Sparkles, Loader2
} from 'lucide-react';
import { VoiceButton, type VoiceState } from './components/VoiceButton';
import { AccountSelector } from './components/AccountSelector';
import { Dashboard } from './components/Dashboard';
import { SessionSummary } from './components/SessionSummary';
import { AnalyticsView } from './components/AnalyticsView';
import { AccountsView } from './components/AccountsView';
import { TransactionsView } from './components/TransactionsView';
import { cn } from './utils/cn';
import type { DashboardData, Session, Transaction, FinancialGoal } from './types';
import type { Account as DbAccount } from './types/database';
import { processVoiceInput, type PipelineProgress, type PipelineStage } from './services/pipeline';
import {
  getAccounts,
  getTransactions,
  getBudgets,
  getGoals,
} from './services/database';

function mapDbAccountToUi(account: DbAccount): { id: string; name: string; type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan' | 'ewallet'; balance: number } {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    balance: account.balance,
  };
}

function mapDbTransactionToUi(tx: any): Transaction {
  return {
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    merchant: tx.merchant ?? undefined,
    description: tx.description ?? undefined,
    date: tx.transaction_date,
    isRecurring: tx.is_recurring,
    recurrence: tx.recurrence ?? undefined,
    accountId: tx.account_id ?? undefined,
    isVerified: tx.is_verified,
    voiceSessionId: tx.voice_session_id ?? undefined,
  };
}

function mapDbGoalToUi(goal: any): FinancialGoal {
  return {
    id: goal.id,
    name: goal.name,
    targetAmount: goal.target_amount,
    currentAmount: goal.current_amount,
    monthlyContribution: goal.monthly_contribution ?? undefined,
    targetDate: goal.target_date ?? undefined,
    priority: goal.priority,
  };
}

type ActiveView = 'dashboard' | 'transactions' | 'analytics' | 'accounts';

function App() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress>({
    stage: 'idle',
    message: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [accounts, transactions, budgets, goals] = await Promise.all([
        getAccounts(),
        getTransactions(100),
        getBudgets(),
        getGoals(),
      ]);

      const uiAccounts = accounts.map(mapDbAccountToUi);
      const uiTransactions = transactions.map(mapDbTransactionToUi);
      const uiBudgets = budgets.map((b) => ({
        id: b.id,
        category: b.category,
        amount: b.amount,
        spent: b.spent,
        period: b.period,
      }));
      const uiGoals = goals.map(mapDbGoalToUi);

      const totalIncome = transactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const totalExpenses = transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const netSavings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? netSavings / totalIncome : 0;

      setDashboardData({
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        transactions: uiTransactions,
        budgets: uiBudgets,
        goals: uiGoals,
        subscriptions: [],
        accounts: uiAccounts,
        recentSessions: [],
      });

      if (uiAccounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(uiAccounts[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTranscript = useCallback(async (audioBlob: Blob, fallbackTranscript: string = '') => {
    setVoiceError(null);
    setPipelineProgress({ stage: 'transcribing', message: 'Transcribing audio...' });

    try {
      const result = await processVoiceInput(audioBlob, fallbackTranscript, (progress: PipelineProgress) => {
        setPipelineProgress(progress);
      });

      const newTransactions = result.transactions.map(mapDbTransactionToUi);

      setDashboardData((prev) => {
        if (!prev) return prev;

        const additionalIncome = newTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const additionalExpenses = newTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const remainingTransactions = prev.transactions.filter(
          (t) => !result.deletedTransactionIds.includes(t.id)
        );

        return {
          ...prev,
          transactions: [...newTransactions, ...remainingTransactions],
          totalIncome: prev.totalIncome + additionalIncome,
          totalExpenses: prev.totalExpenses + additionalExpenses,
          netSavings: prev.netSavings + additionalIncome - additionalExpenses,
        };
      });

      let summaryText = result.summary;
      if (result.goalsCreated > 0) {
        summaryText += ` Created ${result.goalsCreated} goal(s).`;
      }
      if (result.transactionsDeleted > 0) {
        summaryText += ` Removed ${result.transactionsDeleted} transaction(s).`;
      }

      const session: Session = {
        id: result.session.id,
        duration: result.session.audio_duration_ms ?? 0,
        startedAt: result.session.created_at,
        summary: summaryText,
        totalIncome: result.transactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: result.transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        transactionsCount: result.transactions.length,
      };

      setCurrentSession(session);
      setIsSummaryOpen(true);

      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process voice input';
      setVoiceError(message);
      setPipelineProgress({ stage: 'error', message: message });
      console.error('Voice pipeline error:', err);
    }
  }, [fetchData]);

  const handleStateChange = useCallback((state: VoiceState) => {
    setVoiceState(state);
  }, []);

  const navItems = [
    { id: 'dashboard' as ActiveView, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'transactions' as ActiveView, icon: List, label: 'Transactions' },
    { id: 'analytics' as ActiveView, icon: PieChart, label: 'Analytics' },
    { id: 'accounts' as ActiveView, icon: Wallet, label: 'Accounts' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-900 text-cream-400 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-highlight-500 to-highlight-600 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-cream-400" />
          </div>
          <p className="text-cream-400/60">Loading your finances...</p>
        </motion.div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-theme-900 text-cream-400 flex items-center justify-center">
        <div className="text-center">
          <p className="text-highlight-500">Failed to load data. Check your Supabase connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-900 text-cream-400">
      <div className="fixed inset-0 bg-gradient-to-br from-theme-900 via-theme-800 to-theme-900" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-black/10 via-transparent to-transparent" />

      <div className="relative z-10 flex min-h-screen">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={cn(
            'fixed lg:sticky lg:top-0 left-0 h-screen w-72 bg-theme-800/80 backdrop-blur-xl border-r border-theme-700 flex flex-col transition-transform duration-300 z-50',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight-500 to-highlight-600 flex items-center justify-center shadow-lg shadow-highlight-500/20">
                <Wallet className="w-6 h-6 text-cream-400" />
              </div>
              <div>
                <h1 className="font-bold text-cream-400">VoiceBudget</h1>
                <p className="text-xs text-highlight-500">AI Finance Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-theme-700"
            >
              <X className="w-5 h-5 text-cream-400/60" />
            </button>
          </div>

          <nav className="px-4 space-y-1 flex-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  activeView === item.id
                    ? 'bg-highlight-500/20 text-cream-400 shadow-lg shadow-highlight-500/5'
                    : 'text-cream-400/60 hover:bg-theme-700/50 hover:text-cream-300'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-theme-700">
            <div className="p-4 rounded-2xl bg-theme-700/50 border border-highlight-500">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-cream-400" />
                <p className="text-sm font-medium text-cream-300">Talk to your budget</p>
              </div>
              <div className="flex justify-center py-2">
                <VoiceButton
                  onTranscript={handleTranscript}
                  onStateChange={handleStateChange}
                />
              </div>
              {voiceError && (
                <p className="text-xs text-highlight-500 text-center mt-2">{voiceError}</p>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-theme-700 transition-colors"
              >
                <Menu className="w-6 h-6 text-cream-400/60" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-cream-400 capitalize">
                  {activeView}
                </h1>
                <p className="text-sm text-highlight-500">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {activeView === 'dashboard' && dashboardData.accounts.length > 0 && (
                <AccountSelector
                  accounts={dashboardData.accounts}
                  selectedAccountId={selectedAccountId}
                  onSelect={setSelectedAccountId}
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <AnimatePresence>
                {voiceState === 'listening' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-highlight-500/20 border border-highlight-500/30"
                  >
                    <div className="w-2 h-2 rounded-full bg-cream-400 animate-pulse" />
                    <span className="text-xs font-medium text-cream-400">Listening</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          {activeView === 'dashboard' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-4 mb-8"
            >
              <VoiceButton
                onTranscript={handleTranscript}
                onStateChange={handleStateChange}
              />
              <AnimatePresence mode="wait">
                {pipelineProgress.stage !== 'idle' && pipelineProgress.stage !== 'done' && (
                  <motion.div
                    key={pipelineProgress.stage}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 rounded-xl border',
                      pipelineProgress.stage === 'error'
                        ? 'bg-theme-800 border-highlight-500/30'
                        : 'bg-theme-800 border-accent-500/30'
                    )}
                  >
                    <Loader2 className={cn(
                      'w-5 h-5 animate-spin',
                      pipelineProgress.stage === 'error'
                        ? 'text-highlight-500'
                        : 'text-accent-400'
                    )} />
                    <span className={cn(
                      'text-sm font-medium',
                      pipelineProgress.stage === 'error'
                        ? 'text-highlight-500'
                        : 'text-accent-400'
                    )}>
                      {pipelineProgress.message}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === 'dashboard' && (
                <Dashboard data={dashboardData} />
              )}
              {activeView === 'transactions' && (
                <TransactionsView
                  transactions={dashboardData.transactions}
                  accounts={dashboardData.accounts}
                />
              )}
              {activeView === 'analytics' && (
                <AnalyticsView transactions={dashboardData.transactions} />
              )}
              {activeView === 'accounts' && (
                <AccountsView accounts={dashboardData.accounts} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <SessionSummary
        session={currentSession}
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        onConfirm={() => setIsSummaryOpen(false)}
      />
    </div>
  );
}

export default App;
