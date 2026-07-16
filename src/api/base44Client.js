import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { supabaseCompat } from '@/api/supabaseCompat';
import { supabase } from '@/lib/supabase';

const { appId, token, functionsVersion, appBaseUrl } = appParams;
const legacyClient = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: 'https://base44.app',
  requiresAuth: false,
  appBaseUrl,
});

export const base44 = supabase ? supabaseCompat : legacyClient;