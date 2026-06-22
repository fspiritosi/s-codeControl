'use client';

import { useMemo } from 'react';
import { useMyTicketsWithUnread } from './useMyTicketsWithUnread';

/**
 * Cuenta los tickets del usuario con novedades sin leer.
 * Deriva del mismo caché de useMyTicketsWithUnread: no dispara fetch propio.
 */
export function useUnreadSupportTicketsCount(): number {
  const { data } = useMyTicketsWithUnread();
  return useMemo(() => {
    if (!data) return 0;
    return data.filter((t) => t.unread.hasStatusChange || t.unread.hasNewAgentComment).length;
  }, [data]);
}
