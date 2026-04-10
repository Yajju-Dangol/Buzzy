import { supabase } from '../lib/supabase';
import type {
  Account,
  Transaction,
  Tag,
  TransactionTag,
  VoiceSession,
  AiMemory,
  Budget,
  GeminiTransactionResponse,
} from '../types/database';

function isMissingTable(error: any): boolean {
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    error?.message?.includes('relation') ||
    error?.message?.includes('does not exist') ||
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('Could not find the table')
  );
}

async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('User not authenticated');
  return user;
}

// ============================================
// ACCOUNTS
// ============================================

export async function getAccounts(): Promise<Account[]> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return data as Account[];
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) return [];
    throw e;
  }
}

export async function getAccount(id: string): Promise<Account | null> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (isMissingTable(error)) return null;
      throw error;
    }
    return data as Account;
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) return null;
    throw e;
  }
}

export async function createAccount(
  account: Omit<Account, 'id' | 'created_at' | 'updated_at'>
): Promise<Account> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...account, user_id: user.id } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Account;
}

export async function updateAccount(
  id: string,
  updates: Partial<Account>
): Promise<Account> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Account;
}

// ============================================
// TRANSACTIONS
// ============================================

export async function getTransactions(
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return data as Transaction[];
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) return [];
    throw e;
  }
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (isMissingTable(error)) return null;
      throw error;
    }
    return data as Transaction;
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) return null;
    throw e;
  }
}

export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
): Promise<Transaction> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...transaction, user_id: user.id } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function createTransactions(
  transactions: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[]
): Promise<Transaction[]> {
  const user = await getCurrentUser();
  const inserts = transactions.map(t => ({ ...t, user_id: user.id }));
  const { data, error } = await supabase
    .from('transactions')
    .insert(inserts as any)
    .select();

  if (error) throw error;
  return data as Transaction[];
}

export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function getTransactionsByCategory(
  category: string
): Promise<Transaction[]> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', category)
      .order('transaction_date', { ascending: false });

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return data as Transaction[];
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) return [];
    throw e;
  }
}

export async function getTransactionsByAccount(
  accountId: string
): Promise<Transaction[]> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
      .order('transaction_date', { ascending: false });

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return data as Transaction[];
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) return [];
    throw e;
  }
}

export async function getTransactionsByDateRange(
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return data as Transaction[];
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) return [];
    throw e;
  }
}

// ============================================
// TAGS
// ============================================

export async function getTags(): Promise<Tag[]> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return data as Tag[];
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) return [];
    throw e;
  }
}

export async function createTag(name: string, color: string = '#6B7280'): Promise<Tag> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('tags')
    .insert({ name, color, user_id: user.id } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Tag;
}

export async function getOrCreateTag(name: string): Promise<Tag> {
  try {
    const user = await getCurrentUser();
    const { data: existing } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', name)
      .single();

    if (existing) return existing as Tag;
  } catch {
    return { id: '', name, color: '#6B7280', created_at: '' } as Tag;
  }

  return createTag(name);
}

// ============================================
// TRANSACTION_TAGS
// ============================================

export async function addTagsToTransaction(
  transactionId: string,
  tagIds: string[]
): Promise<void> {
  // transaction_tags doesn't need user_id typically if transaction validates it,
  // but let's just insert as before. RLS will protect it.
  const inserts: TransactionTag[] = tagIds.map((tagId) => ({
    transaction_id: transactionId,
    tag_id: tagId,
  }));

  const { error } = await supabase
    .from('transaction_tags')
    .insert(inserts);

  if (error && !isMissingTable(error)) throw error;
}

export async function getTransactionTags(transactionId: string): Promise<Tag[]> {
  try {
    // Assuming transactions RLS will block if user doesn't own it.
    const { data, error } = await supabase
      .from('transaction_tags')
      .select('tags(*)')
      .eq('transaction_id', transactionId);

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return (data as any[]).map((row: any) => row.tags) as Tag[];
  } catch (e) {
    if (isMissingTable(e)) return [];
    throw e;
  }
}

// ============================================
// VOICE SESSIONS
// ============================================

export async function createVoiceSession(
  session: Omit<VoiceSession, 'id' | 'created_at'>
): Promise<VoiceSession> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('voice_sessions')
      .insert({ ...session, user_id: user.id } as any)
      .select()
      .single();

    if (error) {
      if (isMissingTable(error)) {
        return { ...session, id: Date.now().toString(), created_at: new Date().toISOString() } as VoiceSession;
      }
      throw error;
    }
    return data as VoiceSession;
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) {
      return { ...session, id: Date.now().toString(), created_at: new Date().toISOString() } as VoiceSession;
    }
    throw e;
  }
}

export async function updateVoiceSession(
  id: string,
  updates: Partial<VoiceSession>
): Promise<VoiceSession> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('voice_sessions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (isMissingTable(error)) {
        return { id, ...updates } as VoiceSession;
      }
      throw error;
    }
    return data as VoiceSession;
  } catch (e) {
    if (isMissingTable(e)) {
      return { id, ...updates } as VoiceSession;
    }
    throw e;
  }
}

export async function getVoiceSessions(limit: number = 20): Promise<VoiceSession[]> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return data as VoiceSession[];
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) return [];
    throw e;
  }
}

// ============================================
// AI MEMORY
// ============================================

export async function getActiveAiMemories(limit: number = 50): Promise<AiMemory[]> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('ai_memory')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('relevance_score', { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return data as AiMemory[];
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) return [];
    throw e;
  }
}

export async function createAiMemory(
  memory: Omit<AiMemory, 'id' | 'created_at'>
): Promise<AiMemory> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('ai_memory')
      .insert({ ...memory, user_id: user.id } as any)
      .select()
      .single();

    if (error) {
      if (isMissingTable(error)) {
        return { ...memory, id: Date.now().toString(), created_at: new Date().toISOString() } as AiMemory;
      }
      throw error;
    }
    return data as AiMemory;
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) {
      return { ...memory, id: Date.now().toString(), created_at: new Date().toISOString() } as AiMemory;
    }
    throw e;
  }
}

export async function createAiMemories(
  memories: Omit<AiMemory, 'id' | 'created_at'>[]
): Promise<AiMemory[]> {
  try {
    const user = await getCurrentUser();
    const inserts = memories.map(m => ({ ...m, user_id: user.id }));
    const { data, error } = await supabase
      .from('ai_memory')
      .insert(inserts as any)
      .select();

    if (error) {
      if (isMissingTable(error)) {
        return memories.map((m, i) => ({
          ...m,
          id: `${Date.now()}-${i}`,
          created_at: new Date().toISOString(),
        })) as AiMemory[];
      }
      throw error;
    }
    return data as AiMemory[];
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) {
      return memories.map((m, i) => ({
        ...m,
        id: `${Date.now()}-${i}`,
        created_at: new Date().toISOString(),
      })) as AiMemory[];
    }
    throw e;
  }
}

export async function buildMemoryContext(): Promise<string> {
  const memories = await getActiveAiMemories();
  if (memories.length === 0) return '';

  return memories
    .map((m) => `[${m.memory_type}] ${m.content}`)
    .join('\n');
}

// ============================================
// BUDGETS
// ============================================

export async function getBudgets(): Promise<Budget[]> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return data as Budget[];
  } catch (e) {
    if (isMissingTable(e) || (e instanceof Error && e.message === 'User not authenticated')) return [];
    throw e;
  }
}

export async function createBudget(
  budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>
): Promise<Budget> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('budgets')
    .insert({ ...budget, user_id: user.id } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Budget;
}

export async function updateBudget(
  id: string,
  updates: Partial<Budget>
): Promise<Budget> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Budget;
}

// ============================================
// FINANCIAL GOALS
// ============================================

export async function getGoals(): Promise<any[]> {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data;
  } catch {
    return [];
  }
}

export async function createGoal(
  goal: {
    name: string;
    target_amount: number;
    current_amount?: number;
    monthly_contribution?: number | null;
    target_date?: string | null;
    priority: 'high' | 'medium' | 'low';
  }
): Promise<any> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('financial_goals')
    .insert({ ...goal, user_id: user.id } as any)
    .select()
    .single();

  if (error) {
    console.warn('Could not create goal (table may not exist):', error.message);
    return null;
  }
  return data;
}
