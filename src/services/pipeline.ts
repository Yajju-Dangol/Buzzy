import { transcribeAudio } from './elevenlabs';
import { processTranscript } from './gemini';
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
  fallbackTranscript: string = '',
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

    let transcription;
    try {
      transcription = await transcribeAudio(audioBlob, 'ne');
    } catch {
      if (fallbackTranscript) {
        transcription = {
          transcript: fallbackTranscript,
          language: 'ne',
          confidence: 0.7,
          durationMs: audioBlob.size > 0 ? Math.round(audioBlob.size / 16) : 0,
        };
      } else {
        throw new Error('No speech detected. Please try again and speak clearly.');
      }
    }

    await updateVoiceSession(session.id, {
      raw_transcript: transcription.transcript,
      detected_language: transcription.language,
      transcription_confidence: transcription.confidence,
      audio_duration_ms: transcription.durationMs,
    });

    await updateVoiceSession(session.id, { status: 'processing' });
    progress('ai_processing');

    const memoryContext = await buildMemoryContext();

    const recentTransactions = await getTransactions(20);
    const transactionHistory = buildTransactionHistoryString(recentTransactions);

    const geminiResponse = await processTranscript(
      transcription.transcript,
      memoryContext,
      transactionHistory
    );

    await updateVoiceSession(session.id, {
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
        raw_transcript: transcription.transcript,
        gemini_raw_response: geminiResponse,
        confidence_score: geminiResponse.confidence,
        language: transcription.language,
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
    for (const txId of geminiResponse.deleteTransactionIds) {
      try {
        await deleteTransaction(txId);
        transactionsDeleted++;
        deletedIds.push(txId);
      } catch {
        console.warn(`Failed to delete transaction ${txId}`);
      }
    }

    await generateMemoryEntries(
      geminiResponse.transactions,
      transcription.transcript,
      createdTransactions
    );

    const updatedSession = await updateVoiceSession(session.id, {
      status: 'completed',
      gemini_prompt: transcription.transcript,
    });

    progress('done');

    return {
      session: updatedSession,
      transactions: createdTransactions,
      goalsCreated,
      transactionsDeleted,
      deletedTransactionIds: deletedIds,
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
