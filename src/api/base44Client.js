import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { supabaseCompat } from '@/api/supabaseCompat';
import { supabase } from '@/lib/supabase';

// Guard against createClient throwing at module-init time when the
// @base44/vite-plugin is absent (e.g. Vercel production builds).
// A module-level throw here crashes the entire JS bundle before React mounts.
let legacyClient = null;
try {
  const { appId, token, functionsVersion, appBaseUrl } = appParams;
  legacyClient = createClient({
    appId,
    token,
    functionsVersion,
    serverUrl: 'https://base44.app',
    requiresAuth: false,
    appBaseUrl,
  });
} catch (e) {
  console.warn('[base44] SDK init failed, falling back to supabaseCompat:', e?.message);
}

export const base44 = supabase ? supabaseCompat : (legacyClient ?? supabaseCompat);
