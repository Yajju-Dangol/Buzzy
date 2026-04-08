// ============================================
// VoiceBudget AI - Database Types
// ============================================
// Match the Supabase schema exactly
// Run `npx supabase gen types typescript --project-id <id>` after deploying
// ============================================

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'cash'
  | 'investment'
  | 'loan'
  | 'ewallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';
export type Recurrence = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  merchant: string | null;
  description: string | null;
  transaction_date: string;
  currency: string;
  account_id: string | null;
  is_recurring: boolean;
  recurrence: Recurrence | null;
  voice_session_id: string | null;
  raw_transcript: string | null;
  gemini_raw_response: GeminiTransactionResponse | null;
  confidence_score: number | null;
  language: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TransactionTag {
  transaction_id: string;
  tag_id: string;
}

export type VoiceSessionStatus =
  | 'pending'
  | 'transcribing'
  | 'processing'
  | 'completed'
  | 'failed';

export interface VoiceSession {
  id: string;
  audio_url: string | null;
  audio_duration_ms: number | null;
  raw_transcript: string;
  detected_language: string;
  transcription_confidence: number | null;
  gemini_prompt: string | null;
  gemini_response: GeminiTransactionResponse | null;
  transactions_extracted: number;
  status: VoiceSessionStatus;
  error_message: string | null;
  created_at: string;
}

export type AiMemoryType =
  | 'transaction_pattern'
  | 'preference'
  | 'category_insight'
  | 'recurring_detected'
  | 'goal_progress'
  | 'monthly_summary'
  | 'correction';

export interface AiMemory {
  id: string;
  memory_type: AiMemoryType;
  content: string;
  context_data: Record<string, unknown> | null;
  related_transaction_ids: string[];
  relevance_score: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'annually';

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: BudgetPeriod;
  currency: string;
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Gemini Response Types
// ============================================

export interface GeminiTransactionItem {
  type: TransactionType;
  amount: number;
  category: string;
  merchant?: string;
  description?: string;
  date?: string;
  tags?: string[];
  is_recurring?: boolean;
  recurrence?: Recurrence;
  account_hint?: string;
}

export interface GeminiGoalItem {
  name: string;
  targetAmount: number;
  monthlyContribution?: number;
  targetDate?: string;
  priority: 'high' | 'medium' | 'low';
}

export type GeminiActionType =
  | 'add_transaction'
  | 'add_goal'
  | 'delete_transaction';

export interface GeminiTransactionResponse {
  transactions: GeminiTransactionItem[];
  goals: GeminiGoalItem[];
  deleteTransactionIds: string[];
  summary: string;
  language_detected: string;
  confidence: number;
}
