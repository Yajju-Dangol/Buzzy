import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';

interface VoiceButtonProps {
  onTranscript: (audioBlob: Blob) => void | Promise<void>;
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
      chunksRef.current = [];

      // iOS Safari requires HTTPS for microphone access.
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setError('Microphone access requires a secure (HTTPS) connection on mobile.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      streamRef.current = stream;

      // Determine the best supported mimeType (iOS Safari often requires audio/mp4)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : '';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
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

    } catch (err: any) {
      console.error('Error starting voice:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission denied. Please enable it in browser settings.');
      } else {
        setError('Could not access microphone. Ensure you are on HTTPS.');
      }
      setState('idle');
      onStateChange?.('idle');
    }
  }, [onStateChange, state]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        if (chunksRef.current.length === 0) {
          setError('No audio recorded. Please try again.');
          setState('idle');
          onStateChange?.('idle');
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];

        onTranscript(audioBlob);
        setState('idle');
        onStateChange?.('idle');
      };
      
      mediaRecorderRef.current.stop();
    } else {
      setState('idle');
      onStateChange?.('idle');
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setState('processing');
    onStateChange?.('processing');
  }, [onTranscript, onStateChange]);

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
          "relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 outline-none focus:ring-4 focus:ring-highlight-500/50 cursor-pointer overflow-hidden bg-highlight-500 border-none",
          state === 'listening' && "shadow-2xl shadow-highlight-500/50 ring-4 ring-highlight-500",
          state === 'processing' && "bg-theme-700 cursor-wait",
          state === 'idle' && "shadow-xl hover:shadow-2xl"
        )}
        whileHover={state !== 'processing' ? { scale: 1.05 } : {}}
        whileTap={state !== 'processing' ? { scale: 0.95 } : {}}
      >
        <div className="relative z-10 w-full h-full">
          {state === 'idle' && (
            <img src="/buzzy.png" alt="Buzzy Microphone" className="w-full h-full object-cover" />
          )}
          {state === 'listening' && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-full h-full"
            >
              <img src="/buzzy.png" alt="Buzzy Microphone" className="w-full h-full object-cover" />
            </motion.div>
          )}
          {state === 'processing' && (
            <div className="w-full h-full flex items-center justify-center bg-theme-800">
              <Loader2 className="w-12 h-12 text-cream-300 animate-spin" />
            </div>
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
