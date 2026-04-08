export interface TranscriptionResult {
  transcript: string;
  language: string;
  confidence: number;
  durationMs: number;
}

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

export async function transcribeAudio(
  audioBlob: Blob,
  languageCode: string = 'ne'
): Promise<TranscriptionResult> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('No ElevenLabs API key configured');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model_id', 'scribe_v2');
  formData.append('language_code', languageCode);
  formData.append('tag_audio_events', 'false');
  formData.append('diarize', 'false');

  const response = await fetch(`${ELEVENLABS_BASE_URL}/speech-to-text`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  return {
    transcript: data.text,
    language: data.language_code || languageCode,
    confidence: data.language_probability ?? 0,
    durationMs: audioBlob.size > 0 ? Math.round(audioBlob.size / 16) : 0,
  };
}

export async function textToSpeech(text: string, voiceId: string = 'EXAVITQu4vr4xnSDxMaL'): Promise<Blob> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('No ElevenLabs API key configured');
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS error (${response.status}): ${errorText}`);
  }

  return await response.blob();
}
