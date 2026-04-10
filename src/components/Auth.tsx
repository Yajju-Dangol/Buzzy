import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, Loader2 } from 'lucide-react';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to log in with Google');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-theme-800 rounded-2xl p-8 border border-theme-700 shadow-2xl text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-highlight-500 to-highlight-600 flex items-center justify-center shadow-lg shadow-highlight-500/20">
          <Wallet className="w-8 h-8 text-cream-400" />
        </div>
        <h1 className="text-3xl font-bold text-cream-400 mb-2">Welcome to Buzzy</h1>
        <p className="text-cream-400/60 mb-8">Your AI Finance Assistant</p>

        {error && (
          <div className="mb-4 bg-highlight-500/10 border border-highlight-500/50 rounded-lg p-3 text-sm text-highlight-500">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-theme-700 hover:bg-theme-600 text-cream-400 py-3 px-4 rounded-xl transition-all duration-200 border border-theme-600 hover:border-highlight-500/50 focus:outline-none focus:ring-2 focus:ring-highlight-500 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-5 h-5 bg-white rounded-full p-0.5">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              <span className="font-medium">Continue with Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
