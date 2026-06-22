'use client';

import { useRef } from 'react';
import type { TicketWithUnread } from '@/shared/lib/taskapp/types';
import { MyTicketsListSkeleton } from '../fallback/MyTicketsListSkeleton';
import { MY_TICKETS_PAGE_SIZE } from '../hooks/useMyTicketsPage';
import { EmptyTicketsState } from './EmptyTicketsState';
import { PageFetchBar, PaginationNav } from './PaginationNav';
import { TicketCard } from './TicketCard';

interface Props {
  /** Tickets de la página actual (paginados server-side, más recientes primero). */
  tickets: TicketWithUnread[];
  /** Total de tickets sin paginar (para la navegación). */
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  activeTicketId: number | null;
  onSelect: (id: number) => void;
  /** Primera carga sin datos: muestra el skeleton dedicado. */
  isLoading?: boolean;
  /** Página nueva en viaje (keepPreviousData): atenúa la saliente + barra. */
  isPageTransition?: boolean;
}

export function MyTicketsList({
  tickets,
  total,
  page,
  onPageChange,
  activeTicketId,
  onSelect,
  isLoading,
  isPageTransition = false,
}: Props) {
  const listRef = useRef<HTMLDivElement | null>(null);

  if (isLoading) return <MyTicketsListSkeleton />;
  if (total === 0) return <EmptyTicketsState />;

  const showPagination = total > MY_TICKETS_PAGE_SIZE;

  function goTo(next: number) {
    onPageChange(next);
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <PageFetchBar active={isPageTransition} />

      <div
        ref={listRef}
        // px-1 da espacio para la sombra del hover sin chocar con el scrollbar.
        // pb-3 evita que la última card aparezca pegada al borde inferior del Card padre.
        // En desktop la card padre fija la altura: la lista llena el espacio y
        // scrollea internamente (lg:flex-1). En mobile cae al tope de 70vh.
        // Durante la transición de página la lista saliente queda atenuada y
        // sin interacción hasta que llega la nueva (sin parpadeo ni skeleton).
        className={`flex flex-col gap-3 max-h-[70vh] overflow-y-auto px-1 pb-3 lg:max-h-none lg:flex-1 lg:min-h-0 transition-[opacity,filter] duration-200 ${
          isPageTransition ? 'pointer-events-none opacity-50 saturate-50' : ''
        }`}
        aria-busy={isPageTransition}
      >
        {/* key={page}: la página entrante se monta con su animación de entrada. */}
        <div key={page} className="flex flex-col gap-3 animate-in fade-in-25 duration-300">
          {tickets.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              onClick={onSelect}
              isActive={activeTicketId === t.id}
            />
          ))}
        </div>
      </div>

      {showPagination && (
        <PaginationNav
          page={page}
          total={total}
          pageSize={MY_TICKETS_PAGE_SIZE}
          onPageChange={goTo}
          isFetching={isPageTransition}
          className="mt-auto shrink-0 border-t pt-3"
        />
      )}
    </div>
  );
}
