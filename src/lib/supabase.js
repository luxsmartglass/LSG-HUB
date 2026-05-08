import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Test connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('settings').select('key, value').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected:', data);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
    return { success: false, error: err.message };
  }
}

export default supabase;
