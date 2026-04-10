import type { GeminiTransactionResponse } from '../types/database';
import { convertWebmToWav } from '../utils/audio';

declare const puter: any;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const GEMINI_AUDIO_MODEL = 'gemini-3-flash-preview';

const SYSTEM_PROMPT = `You are Buzzy AI, a Nepali-language financial assistant. You analyze voice transcripts and perform three types of actions:

1. ADD TRANSACTIONS — Extract income, expenses, transfers
2. CREATE FINANCIAL GOALS — Identify savings goals, targets
3. DELETE TRANSACTIONS — Remove old transactions the user wants to undo

RULES FOR TRANSACTIONS:
- Parse the transcript and identify ALL transactions mentioned
- Extract: type (income/expense/transfer), amount, category, merchant, description, date, tags, is_recurring, recurrence pattern
- Common Nepali categories: खाना (food), यात्रा (transport), बिल (bills), किनमेल (shopping), स्वास्थ्य (health), मनोरञ्जन (entertainment), शिक्षा (education), भाडा (rent), तलब (salary), पसल (groceries)
- Map Nepali merchant names as-is
- Use the current date provided in the prompt for "today". Calculate relative dates for "yesterday" or "tomorrow". Output dates strictly in YYYY-MM-DD format.
- If no date mentioned, use today
- If account hinted (e.g., "eSewa", "cash", "bank"), set account_hint
- Detect recurring patterns

RULES FOR FINANCIAL GOALS:
- When user mentions saving for something (emergency fund, vacation, house, car, etc.), create a goal
- Extract: name, targetAmount, monthlyContribution (if mentioned), targetDate (if mentioned), priority
- Priority: high = urgent/essential (emergency fund, debt), medium = important (vacation, education), low = nice-to-have (luxury items)
- If target amount not explicitly stated, estimate reasonably based on context
- If monthly contribution mentioned, include it

RULES FOR DELETING & UPDATING:
- Use the provided TRANSACTION HISTORY and GOAL HISTORY to identify what the user wants to update/delete based on context and ID.
- To delete, specify the exact ID in \`deleteTransactionIds\` or \`deleteGoalIds\`.
- To update, provide the ID and ONLY the fields that should be changed in \`updateTransactions\` or \`updateGoals\`. (e.g. if user says "change the laptop goal to 60k", provide the ID for the laptop goal and \`{"targetAmount": 60000}\`). Do not include unchanged fields.

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
  "updateTransactions": [
    {
      "id": "target-transaction-id",
      "amount": 500, // (only include the fields being updated)
      "category": "updated_category",
      "date": "2026-04-10"
    }
  ],
  "updateGoals": [
    {
      "id": "target-goal-id",
      "targetAmount": 60000 // (only include the fields being updated)
    }
  ],
  "deleteTransactionIds": ["transaction-id-1"],
  "deleteGoalIds": ["goal-id-1"],
  "summary": "Brief summary of ALL actions taken",
  "language_detected": "ne" | "en" | "mixed",
  "confidence": 0.0 to 1.0,
  "transcript": "Full accurate transcription of the user's audio input"
}`;

export async function processTranscript(
  transcript: string,
  aiMemoryContext: string = '',
  transactionHistory: string = ''
): Promise<GeminiTransactionResponse> {
  const memorySection = aiMemoryContext
    ? `\n\nRECENT TRANSACTION CONTEXT (for reference):\n${aiMemoryContext}`
    : '';

  const historySection = transactionHistory
    ? `\n\nYOUR TRANSACTION HISTORY (use this to match and delete old transactions if user asks to undo/remove something):\n${transactionHistory}`
    : '';

  const userPrompt = `${SYSTEM_PROMPT}\n\nParse this Nepali voice transcript into structured transactions, goals, and delete actions:\n\nTRANSCRIPT:\n"${transcript}"\n${memorySection}\n${historySection}\n\nReturn ONLY valid JSON matching the response schema. No markdown, no explanation. If no goals or deletions are needed, return empty arrays for those fields.`;

  const response = await puter.ai.chat(userPrompt, {
    model: GEMINI_MODEL,
    temperature: 0.1,
  });

  const responseText = typeof response === 'string' ? response : (response?.text || response?.message?.content || String(response));

  const cleaned = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    return JSON.parse(cleaned) as GeminiTransactionResponse;
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${cleaned}`);
  }
}

export async function processAudioInput(
  rawAudioBlob: Blob,
  aiMemoryContext: string = '',
  transactionHistory: string = '',
  goalsHistory: string = ''
): Promise<GeminiTransactionResponse> {
  // Convert browser's native WebM recording to proper WAV format
  const wavBlob = await convertWebmToWav(rawAudioBlob);

  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(wavBlob);
  });

  const memorySection = aiMemoryContext
    ? `\n\nRECENT TRANSACTION CONTEXT (for reference):\n${aiMemoryContext}`
    : '';

  const historySection = transactionHistory
    ? `\n\nYOUR TRANSACTION HISTORY (for updating/deleting):\n${transactionHistory}`
    : '';

  const goalsSection = goalsHistory
    ? `\n\nYOUR FINANCIAL GOALS (for updating/deleting):\n${goalsHistory}`
    : '';

  const now = new Date();
  const currentDateStr = now.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  const userPrompt = `${SYSTEM_PROMPT}\n\nParse this Nepali voice input into structured transactions, goals, updates, and delete actions.\n\n=== CURRENT DATE & TIME ===\n${currentDateStr}\n===========================\n  \n${memorySection}\n${historySection}\n${goalsSection}\n\nListen carefully to the provided audio for transaction details. Return ONLY valid JSON.`;

  try {
    // Convert Blob to Data URL for better compatibility with Puter's media handler
    const audioDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(wavBlob);
    });

    const response = await puter.ai.chat(userPrompt, audioDataUrl, {
      model: GEMINI_AUDIO_MODEL,
      temperature: 0.1,
    });

    if (!response) {
      throw new Error('Puter.js returned an empty response for audio input.');
    }

    const responseText = typeof response === 'string' ? response : (response?.text || response?.message?.content || String(response));

    const cleaned = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(cleaned) as GeminiTransactionResponse;
  } catch (error) {
    console.error('Puter.js Audio Error:', error);
    throw new Error(`AI processing failed: ${error instanceof Error ? error.message : 'Unknown Puter error'}`);
  }
}

export async function generateWeeklySummary(
  transactions: any[],
  aiMemories: any[]
): Promise<string> {
  const userPrompt = `# AUDIO PROFILE: Buzzy
## "Your Personal Financial Guide"

## THE SCENE: A quiet, supportive home office
Buzzy is speaking directly to the user, providing a warm and encouraging overview of their recent financial activity. The tone is informative yet optimistic.

### DIRECTOR'S NOTES
Style: Warm, encouraging, and clear. Use a "vocal smile" to make the financial advice feel supportive rather than critical.
Pace: Moderate and easy to follow.
Accent: Nepali

#### TRANSCRIPT
Generate a short, engaging summary in Nepali (approx 2-3 sentences) based on the following data:
- TOTALS: ${JSON.stringify(transactions)}
- INSIGHTS: ${JSON.stringify(aiMemories)}

Focus on: total income/spend highlights and one encouraging insight. Output ONLY the Devanagari script text for the transcript.`;

  const response = await puter.ai.chat(userPrompt, {
    model: GEMINI_MODEL,
    temperature: 0.7,
  });

  const responseText = typeof response === 'string' ? response : (response?.text || response?.message?.content || String(response));
  return responseText.trim();
}

export async function generateTTSAudio(text: string): Promise<Blob> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY in .env');
  }

  const url = `${GEMINI_BASE_URL}/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text }]
        }
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini TTS API error: ${errorBody}`);
  }

  const data = await response.json();
  const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error('No audio data returned from Gemini TTS');
  }

  const pcmBinaryString = atob(base64Audio);
  const pcmLen = pcmBinaryString.length;
  const pcmData = new Uint8Array(pcmLen);
  for (let i = 0; i < pcmLen; i++) {
    pcmData[i] = pcmBinaryString.charCodeAt(i);
  }

  // Add WAV Header (PCM, 24kHz, 16-bit, Mono)
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); 
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); 
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length, true);

  return new Blob([header, pcmData], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

