'use client';

import type { ReactNode } from 'react';
import { useSupportTicketsRealtimeSync } from '../hooks/useSupportTicketsRealtimeSync';

export function SupportTicketsRealtimeProvider({ children }: { children: ReactNode }) {
  useSupportTicketsRealtimeSync();
  return <>{children}</>;
}
