import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

interface UseRealtimeOptions {
  table: string;
  schema?: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
  enabled?: boolean;
}

/**
 * Hook for subscribing to Supabase Realtime changes on a table.
 * Auto-cleans up on unmount or when deps change.
 */
export function useRealtimeSubscription({
  table,
  schema = 'public',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: UseRealtimeOptions) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-${table}-${filter || 'all'}-${Date.now()}`;

    const pgChangesFilter: any = {
      event: '*' as const,
      schema,
      table,
    };

    if (filter) {
      pgChangesFilter.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', pgChangesFilter, (payload) => {
        const event = payload.eventType as RealtimeEvent;

        onChange?.(payload);

        if (event === 'INSERT') onInsert?.(payload);
        if (event === 'UPDATE') onUpdate?.(payload);
        if (event === 'DELETE') onDelete?.(payload);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [table, schema, filter, enabled]);
}
