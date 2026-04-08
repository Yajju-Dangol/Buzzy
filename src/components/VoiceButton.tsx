import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';

interface VoiceButtonProps {
  onTranscript: (audioBlob: Blob, fallbackTranscript: string) => void | Promise<void>;
  onStateChange?: (state: VoiceState) => void;
}

export type VoiceState = 'idle' | 'listening' | 'processing';

export function VoiceButton({ onTranscript, onStateChange }: VoiceButtonProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      setLiveTranscript('');
      chunksRef.current = [];

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ne-NP';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setLiveTranscript(final + interim);
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'no-speech') {
          } else if (event.error === 'not-allowed') {
            setError('Microphone access denied.');
          }
        };

        recognition.onend = () => {
          if (state === 'listening') {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000);
      setState('listening');
      onStateChange?.('listening');

    } catch (err) {
      console.error('Error starting voice:', err);
      setError('Could not access microphone.');
      setState('idle');
      onStateChange?.('idle');
    }
  }, [onStateChange, state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setState('processing');
    onStateChange?.('processing');

    const transcript = liveTranscript.trim();
    if (!transcript && chunksRef.current.length === 0) {
      setError('No speech detected. Please try again.');
      setState('idle');
      onStateChange?.('idle');
      return;
    }

    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const fallbackTranscript = liveTranscript.trim();
    chunksRef.current = [];

    setTimeout(() => {
      onTranscript(audioBlob, fallbackTranscript);
      setLiveTranscript('');
      setState('idle');
      onStateChange?.('idle');
    }, 500);
  }, [liveTranscript, onTranscript, onStateChange]);

  const handleClick = useCallback(() => {
    if (state === 'idle') {
      startListening();
    } else if (state === 'listening') {
      stopListening();
    }
  }, [state, startListening, stopListening]);

  return (
    <div className="relative flex flex-col items-center gap-4">
      <AnimatePresence>
        {state === 'listening' && (
          <>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2 border-highlight-500/30"
                style={{ width: 256, height: 256 }}
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        disabled={state === 'processing'}
        className={cn(
          "relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 outline-none focus:ring-4 focus:ring-highlight-500/50",
          state === 'listening' && "bg-gradient-to-br from-highlight-500 to-highlight-600 shadow-2xl shadow-highlight-500/50",
          state === 'processing' && "bg-theme-700 cursor-wait",
          state === 'idle' && "bg-gradient-to-br from-highlight-500 to-theme-700 hover:from-highlight-400 hover:to-highlight-500 shadow-xl cursor-pointer"
        )}
        whileHover={state !== 'processing' ? { scale: 1.05 } : {}}
        whileTap={state !== 'processing' ? { scale: 0.95 } : {}}
      >
        {state === 'listening' && (
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cream-400/20 via-highlight-500/30 to-cream-400/20" />
          </motion.div>
        )}

        <div className="relative z-10">
          {state === 'idle' && (
            <Mic className="w-12 h-12 text-cream-300" />
          )}
          {state === 'listening' && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Mic className="w-12 h-12 text-cream-400" />
            </motion.div>
          )}
          {state === 'processing' && (
            <Loader2 className="w-12 h-12 text-cream-300 animate-spin" />
          )}
        </div>

        {state === 'listening' && (
          <>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-cream-400/40"
                animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </>
        )}
      </motion.button>

      {state === 'listening' && liveTranscript && (
        <motion.p
          className="text-cream-400/60 text-xs text-center max-w-xs italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          "{liveTranscript.slice(0, 100)}{liveTranscript.length > 100 ? '...' : ''}"
        </motion.p>
      )}

      <motion.div
        className="text-center h-8"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
      >
        {state === 'idle' && (
          <motion.p
            className="text-cream-400/60 text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Click to start
          </motion.p>
        )}
        {state === 'listening' && (
          <motion.p
            className="text-highlight-500 text-sm font-medium flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Sparkles className="w-4 h-4" />
            Listening... (click to stop)
          </motion.p>
        )}
        {state === 'processing' && (
          <motion.p
            className="text-accent-500 text-sm font-medium flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </motion.p>
        )}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            className="text-highlight-500 text-xs text-center max-w-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
