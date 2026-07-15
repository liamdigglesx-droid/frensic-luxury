import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { supabaseCompat } from '@/api/supabaseCompat';

const { appId, token, functionsVersion, appBaseUrl } = appParams;
const legacyClient = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: 'https://base44.app',
  requiresAuth: false,
  appBaseUrl,
});

export const base44 = import.meta.env.VITE_SUPABASE_URL ? supabaseCompat : legacyClient;