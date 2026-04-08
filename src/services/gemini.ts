import type { GeminiTransactionResponse } from '../types/database';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

const SYSTEM_PROMPT = `You are Buzzy AI, a Nepali-language financial assistant. You analyze voice transcripts and perform three types of actions:

1. ADD TRANSACTIONS — Extract income, expenses, transfers
2. CREATE FINANCIAL GOALS — Identify savings goals, targets
3. DELETE TRANSACTIONS — Remove old transactions the user wants to undo

RULES FOR TRANSACTIONS:
- Parse the transcript and identify ALL transactions mentioned
- Extract: type (income/expense/transfer), amount, category, merchant, description, date, tags, is_recurring, recurrence pattern
- Common Nepali categories: खाना (food), यात्रा (transport), बिल (bills), किनमेल (shopping), स्वास्थ्य (health), मनोरञ्जन (entertainment), शिक्षा (education), भाडा (rent), तलब (salary), पसल (groceries)
- Map Nepali merchant names as-is
- If no date mentioned, use today
- If account hinted (e.g., "eSewa", "cash", "bank"), set account_hint
- Detect recurring patterns

RULES FOR FINANCIAL GOALS:
- When user mentions saving for something (emergency fund, vacation, house, car, etc.), create a goal
- Extract: name, targetAmount, monthlyContribution (if mentioned), targetDate (if mentioned), priority
- Priority: high = urgent/essential (emergency fund, debt), medium = important (vacation, education), low = nice-to-have (luxury items)
- If target amount not explicitly stated, estimate reasonably based on context
- If monthly contribution mentioned, include it

RULES FOR DELETING TRANSACTIONS:
- When user says "undo", "delete", "remove", "cancel", "wrong", "mistake" about a past transaction, add its ID to deleteTransactionIds
- Match by merchant, category, amount, or description from the transaction history provided
- Only delete if the user clearly wants to remove it
- If user says "I didn't spend X at Y" or "that was wrong", delete the matching transaction

RESPONSE SCHEMA (JSON only, no markdown):
{
  "transactions": [
    {
      "type": "income" | "expense" | "transfer",
      "amount": number,
      "category": string,
      "merchant": string (optional),
      "description": string (optional),
      "date": "YYYY-MM-DD" (optional),
      "tags": string[] (optional),
      "is_recurring": boolean (optional),
      "recurrence": "weekly" | "biweekly" | "monthly" | "quarterly" | "annually" (optional),
      "account_hint": string (optional)
    }
  ],
  "goals": [
    {
      "name": string,
      "targetAmount": number,
      "monthlyContribution": number (optional),
      "targetDate": "YYYY-MM-DD" (optional),
      "priority": "high" | "medium" | "low"
    }
  ],
  "deleteTransactionIds": ["transaction-id-1", "transaction-id-2"],
  "summary": "Brief summary of ALL actions taken (transactions added, goals created, transactions deleted)",
  "language_detected": "ne" | "en" | "mixed",
  "confidence": 0.0 to 1.0
}`;

export async function processTranscript(
  transcript: string,
  aiMemoryContext: string = '',
  transactionHistory: string = ''
): Promise<GeminiTransactionResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY in .env');
  }

  const memorySection = aiMemoryContext
    ? `\n\nRECENT TRANSACTION CONTEXT (for reference):\n${aiMemoryContext}`
    : '';

  const historySection = transactionHistory
    ? `\n\nYOUR TRANSACTION HISTORY (use this to match and delete old transactions if user asks to undo/remove something):\n${transactionHistory}`
    : '';

  const userPrompt = `Parse this Nepali voice transcript into structured transactions, goals, and delete actions:

TRANSCRIPT:
"${transcript}"
${memorySection}
${historySection}

Return ONLY valid JSON matching the response schema. No markdown, no explanation. If no goals or deletions are needed, return empty arrays for those fields.`;

  const response = await fetch(
    `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              { text: userPrompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  const cleaned = rawText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    return JSON.parse(cleaned) as GeminiTransactionResponse;
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${cleaned}`);
  }
}

export async function generateWeeklySummary(
  transactions: any[],
  aiMemories: any[]
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY in .env');
  }

  const userPrompt = `You are an AI financial assistant. Make an engaging, short, friendly summary in Nepali language (approx. 2-3 sentences max) based on the user's data from the last 7 days.
Focus strictly on the key highlights: total income/spend, the top expense category, and any relevant insight from their AI memory notes.
The summary MUST ONLY be in written Nepali (Devanagari script), formatted to sound natural when spoken by a Text-to-Speech system.

LAST 7 DAYS TRANSACTIONS:
${JSON.stringify(transactions)}

AI MEMORIES:
${JSON.stringify(aiMemories)}

Return ONLY the Nepali text.`;

  const response = await fetch(
    `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error generating summary`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return rawText.trim();
}
