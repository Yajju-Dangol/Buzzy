import { transcribeAudio } from './elevenlabs';
import { processTranscript, processAudioInput } from './gemini';
import {
  createVoiceSession,
  updateVoiceSession,
  createTransaction,
  getOrCreateTag,
  addTagsToTransaction,
  buildMemoryContext,
  createAiMemories,
  getAccounts,
  getTransactions,
  deleteTransaction,
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
  updateTransaction,
} from './database';
import type {
  Transaction,
  VoiceSession,
  GeminiTransactionItem,
  AiMemory,
  GeminiTransactionResponse,
} from '../types/database';

export type PipelineStage =
  | 'idle'
  | 'transcribing'
  | 'ai_processing'
  | 'saving'
  | 'done'
  | 'error';

export interface PipelineProgress {
  stage: PipelineStage;
  message: string;
}

export type ProgressCallback = (progress: PipelineProgress) => void;

export interface PipelineResult {
  session: VoiceSession;
  transactions: Transaction[];
  goalsCreated: number;
  transactionsDeleted: number;
  deletedTransactionIds: string[];
  transactionsUpdated: number;
  goalsUpdated: number;
  goalsDeleted: number;
  summary: string;
}

const STAGE_MESSAGES: Record<PipelineStage, string> = {
  idle: '',
  transcribing: 'Transcribing audio...',
  ai_processing: 'AI analyzing...',
  saving: 'Saving to database...',
  done: 'Done!',
  error: 'Something went wrong',
};

export async function processVoiceInput(
  audioBlob: Blob,
  onProgress?: ProgressCallback
): Promise<PipelineResult> {
  const progress = (stage: PipelineStage) => {
    onProgress?.({ stage, message: STAGE_MESSAGES[stage] });
  };

  const session = await createVoiceSession({
    audio_url: null,
    audio_duration_ms: null,
    raw_transcript: '',
    detected_language: 'ne',
    transcription_confidence: null,
    gemini_prompt: null,
    gemini_response: null,
    transactions_extracted: 0,
    status: 'pending',
    error_message: null,
  });

  try {
    await updateVoiceSession(session.id, { status: 'transcribing' });
    progress('transcribing');

    await updateVoiceSession(session.id, { status: 'processing' });
    progress('ai_processing');

    const memoryContext = await buildMemoryContext();

    const recentTransactions = await getTransactions(20);
    const transactionHistory = buildTransactionHistoryString(recentTransactions);

    const recentGoals = await getGoals();
    const goalsHistory = buildGoalsHistoryString(recentGoals);

    // Call Gemini directly with the audio blob to decode completely
    const geminiResponse = await processAudioInput(
      audioBlob,
      memoryContext,
      transactionHistory,
      goalsHistory
    );
    
    const transcriptionText = geminiResponse.transcript || 'Audio processed via Gemini.';

    await updateVoiceSession(session.id, {
      raw_transcript: transcriptionText,
      detected_language: geminiResponse.language_detected || 'ne',
      transcription_confidence: geminiResponse.confidence,
      audio_duration_ms: audioBlob.size > 0 ? Math.round(audioBlob.size / 16) : 0,
      gemini_response: geminiResponse,
      transactions_extracted: geminiResponse.transactions.length,
    });

    progress('saving');

    const accounts = await getAccounts();
    const createdTransactions: Transaction[] = [];

    for (const item of geminiResponse.transactions) {
      const accountId = resolveAccountId(item, accounts);

      const transaction = await createTransaction({
        type: item.type,
        amount: item.amount,
        category: item.category,
        merchant: item.merchant ?? null,
        description: item.description ?? null,
        transaction_date: item.date ?? new Date().toISOString().split('T')[0],
        currency: 'NPR',
        account_id: accountId,
        is_recurring: item.is_recurring ?? false,
        recurrence: item.recurrence ?? null,
        voice_session_id: session.id,
        raw_transcript: transcriptionText,
        gemini_raw_response: geminiResponse,
        confidence_score: geminiResponse.confidence,
        language: geminiResponse.language_detected || 'ne',
        is_verified: false,
      });

      if (item.tags && item.tags.length > 0) {
        const tagIds = await Promise.all(
          item.tags.map(async (tagName) => {
            const tag = await getOrCreateTag(tagName);
            return tag.id;
          })
        );
        await addTagsToTransaction(transaction.id, tagIds);
      }

      createdTransactions.push(transaction);
    }

    let goalsCreated = 0;
    for (const goal of geminiResponse.goals) {
      const result = await createGoal({
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: 0,
        monthly_contribution: goal.monthlyContribution ?? null,
        target_date: goal.targetDate ?? null,
        priority: goal.priority,
      });
      if (result) goalsCreated++;
    }

    let transactionsDeleted = 0;
    const deletedIds: string[] = [];
    if (geminiResponse.deleteTransactionIds) {
      for (const txId of geminiResponse.deleteTransactionIds) {
        try {
          await deleteTransaction(txId);
          transactionsDeleted++;
          deletedIds.push(txId);
        } catch {
          console.warn(`Failed to delete transaction ${txId}`);
        }
      }
    }

    let goalsDeleted = 0;
    if (geminiResponse.deleteGoalIds) {
      for (const gId of geminiResponse.deleteGoalIds) {
        try {
          await deleteGoal(gId);
          goalsDeleted++;
        } catch {
          console.warn(`Failed to delete goal ${gId}`);
        }
      }
    }

    let transactionsUpdated = 0;
    if (geminiResponse.updateTransactions) {
      for (const update of geminiResponse.updateTransactions) {
        try {
          const { id, ...fields } = update;
          // map fields correctly if necessary
          const mapped: any = { ...fields };
          if (fields.date) mapped.transaction_date = fields.date;
          if (fields.is_recurring !== undefined) mapped.is_recurring = fields.is_recurring;
          
          await updateTransaction(id, mapped);
          transactionsUpdated++;
        } catch {
          console.warn(`Failed to update transaction ${update.id}`);
        }
      }
    }

    let goalsUpdated = 0;
    if (geminiResponse.updateGoals) {
      for (const update of geminiResponse.updateGoals) {
        try {
          const { id, ...fields } = update;
          const mapped: any = { ...fields };
          if (fields.targetAmount) mapped.target_amount = fields.targetAmount;
          if (fields.monthlyContribution !== undefined) mapped.monthly_contribution = fields.monthlyContribution;
          if (fields.targetDate) mapped.target_date = fields.targetDate;

          await updateGoal(id, mapped);
          goalsUpdated++;
        } catch {
          console.warn(`Failed to update goal ${update.id}`);
        }
      }
    }

    await generateMemoryEntries(
      geminiResponse.transactions,
      transcriptionText,
      createdTransactions
    );

    const updatedSession = await updateVoiceSession(session.id, {
      status: 'completed',
      gemini_prompt: transcriptionText,
    });

    progress('done');

    return {
      session: updatedSession,
      transactions: createdTransactions,
      goalsCreated,
      transactionsDeleted,
      deletedTransactionIds: deletedIds,
      transactionsUpdated,
      goalsUpdated,
      goalsDeleted,
      summary: geminiResponse.summary,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await updateVoiceSession(session.id, {
      status: 'failed',
      error_message: errorMessage,
    });

    progress('error');

    throw error;
  }
}

function resolveAccountId(
  item: GeminiTransactionItem,
  accounts: any[]
): string | null {
  if (!item.account_hint) return accounts[0]?.id ?? null;

  const hint = item.account_hint.toLowerCase();

  const match = accounts.find(
    (a: any) =>
      a.name.toLowerCase().includes(hint) ||
      a.type.toLowerCase() === hint
  );

  return match?.id ?? accounts[0]?.id ?? null;
}

function buildTransactionHistoryString(transactions: any[]): string {
  if (transactions.length === 0) return 'No transaction history yet.';

  return transactions
    .map(
      (t) =>
        `ID: ${t.id} | ${t.type.toUpperCase()} ${t.amount} NPR | ${t.category} | ${t.merchant ?? 'N/A'} | ${t.description ?? ''} | ${t.transaction_date}`
    )
    .join('\n');
}

function buildGoalsHistoryString(goals: any[]): string {
  if (goals.length === 0) return 'No financial goals yet.';

  return goals
    .map(
      (g) =>
        `ID: ${g.id} | NAME: ${g.name} | TARGET: ${g.target_amount} | CURRENT: ${g.current_amount} | PRIORITY: ${g.priority}`
    )
    .join('\n');
}

async function generateMemoryEntries(
  items: GeminiTransactionItem[],
  transcript: string,
  transactions: Transaction[]
): Promise<void> {
  const memories: Omit<AiMemory, 'id' | 'created_at'>[] = [];

  const totalExpense = items
    .filter((i) => i.type === 'expense')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalIncome = items
    .filter((i) => i.type === 'income')
    .reduce((sum, i) => sum + i.amount, 0);

  if (items.length > 0) {
    memories.push({
      memory_type: 'transaction_pattern',
      content: `User recorded ${items.length} transaction(s): ${items.map((i) => `${i.type} ${i.amount} NPR (${i.category})`).join(', ')}. Original: "${transcript.slice(0, 200)}"`,
      context_data: {
        total_expense: totalExpense,
        total_income: totalIncome,
        transaction_count: items.length,
        categories: [...new Set(items.map((i) => i.category))],
      },
      related_transaction_ids: transactions.map((t) => t.id),
      relevance_score: 0.8,
      is_active: true,
      expires_at: null,
    });
  }

  const recurringItems = items.filter((i) => i.is_recurring);
  for (const item of recurringItems) {
    memories.push({
      memory_type: 'recurring_detected',
      content: `Detected recurring ${item.type}: ${item.amount} NPR for ${item.category}${item.merchant ? ` at ${item.merchant}` : ''} (${item.recurrence})`,
      context_data: {
        amount: item.amount,
        category: item.category,
        merchant: item.merchant,
        recurrence: item.recurrence,
      },
      related_transaction_ids: transactions.map((t) => t.id),
      relevance_score: 0.7,
      is_active: true,
      expires_at: null,
    });
  }

  if (memories.length > 0) {
    await createAiMemories(memories);
  }
}
