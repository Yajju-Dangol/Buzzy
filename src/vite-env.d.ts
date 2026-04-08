/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ELEVENLABS_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_APP_DEFAULT_LANGUAGE: string;
  readonly VITE_APP_DEFAULT_CURRENCY: string;
  readonly VITE_APP_AI_MEMORY_LIMIT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
