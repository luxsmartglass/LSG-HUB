import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtime(table, callback) {
  const channelRef = useRef(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    // Use a unique channel name per mount to avoid "cannot add callbacks after subscribe" error
    const channelName = `realtime:${table}:${Math.random().toString(36).slice(2)}`;

    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        callbackRef.current?.(payload);
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table]);
}

export default useRealtime;
