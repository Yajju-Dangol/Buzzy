export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  merchant?: string;
  description?: string;
  date: string;
  isRecurring: boolean;
  recurrence?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
  accountId?: string;
  tags?: string[];
  isVerified?: boolean;
  voiceSessionId?: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'annually';
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution?: number;
  targetDate?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Subscription {
  id: string;
  serviceName: string;
  amount: number;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  category?: string;
  nextBillingDate?: string;
  isActive: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan' | 'ewallet';
  balance: number;
  currency?: string;
  icon?: string;
}

export interface Session {
  id: string;
  duration: number;
  startedAt: string;
  endedAt?: string;
  summary?: string;
  totalIncome: number;
  totalExpenses: number;
  transactionsCount: number;
}

export interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  subscriptions: Subscription[];
  accounts: Account[];
  recentSessions: Session[];
}

export type VoiceState = 'idle' | 'listening' | 'processing';
