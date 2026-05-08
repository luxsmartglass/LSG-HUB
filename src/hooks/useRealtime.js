import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtime(table, callback) {
  const channelRef = useRef(null);

  useEffect(() => {
    channelRef.current = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        callback?.(payload);
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [table]);
}

export default useRealtime;
