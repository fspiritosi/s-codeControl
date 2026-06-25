'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getApproverTicketsPage,
  getPendingApproverTickets,
} from '../actions/support-approval';

/** Prefijo común: invalidar esto refresca pendientes y todas las páginas. */
export const APPROVER_TICKETS_QUERY_KEY = ['taskapp', 'approver-tickets'];

export const APPROVER_ALL_PAGE_SIZE = 10;

/**
 * Página de la vista auditora del aprobador (server-side, más recientes
 * primero). Para no-aprobadores el backend devuelve vacío y la UI se oculta.
 */
export function useApproverTicketsPage(page: number) {
  return useQuery({
    queryKey: [...APPROVER_TICKETS_QUERY_KEY, 'all', page],
    queryFn: () => getApproverTicketsPage(page, APPROVER_ALL_PAGE_SIZE),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    // Polling mientras la vista del aprobador está abierta (reemplaza al SSE).
    refetchInterval: 30_000,
  });
}

/**
 * Tickets pendientes de aprobación del cliente. Alimenta la bandeja del
 * aprobador y el gate del banner de aprobación en el detalle.
 */
export function usePendingApproverTickets() {
  return useQuery({
    queryKey: [...APPROVER_TICKETS_QUERY_KEY, 'pending'],
    queryFn: () => getPendingApproverTickets(),
    staleTime: 30_000,
    // Polling de pendientes de aprobación (reemplaza al SSE).
    refetchInterval: 30_000,
  });
}
