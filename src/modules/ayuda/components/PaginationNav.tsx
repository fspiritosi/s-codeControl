'use client';

import { Button } from '@/shared/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface PaginationNavProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Hay una página nueva en viaje: spinner + botones bloqueados. */
  isFetching?: boolean;
  ariaLabel?: string;
  className?: string;
}

/**
 * Navegación de paginación server-side compartida por las listas del módulo.
 * Mientras llega la página nueva muestra un spinner junto al contador y
 * bloquea los botones (evita dobles clicks y requests pisadas), sin mover
 * ni un píxel del layout.
 */
export function PaginationNav({
  page,
  total,
  pageSize,
  onPageChange,
  isFetching = false,
  ariaLabel = 'Paginación',
  className = '',
}: PaginationNavProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;

  return (
    <nav
      className={`flex items-center justify-between gap-3 ${className}`}
      aria-label={ariaLabel}
      aria-busy={isFetching}
    >
      <p className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
        {/* El spinner ocupa el lugar reservado por el gap: sin layout shift. */}
        <span className="inline-flex h-3 w-3 items-center justify-center" aria-hidden>
          {isFetching && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </span>
        Mostrando{' '}
        <span className="font-medium text-foreground">
          {Math.min(start + 1, total)}–{Math.min(start + pageSize, total)}
        </span>{' '}
        de <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || isFetching}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-xs font-medium tabular-nums text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || isFetching}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}

/**
 * Barra de progreso indeterminada (estilo GitHub/YouTube) para transiciones de
 * página. Reserva siempre su alto (h-0.5) y solo togglea opacidad: cero layout
 * shift. Usa el color primary del proyecto host.
 */
export function PageFetchBar({ active }: { active: boolean }) {
  return (
    <div
      role="progressbar"
      aria-hidden={!active}
      aria-label="Cargando página"
      className={`relative h-0.5 w-full shrink-0 overflow-hidden rounded-full transition-opacity duration-200 ${
        active ? 'bg-primary/15 opacity-100' : 'opacity-0'
      }`}
    >
      {active && (
        <span
          className="absolute inset-y-0 w-1/3 rounded-full bg-primary"
          style={{ animation: 'taskapp-page-fetch 0.9s ease-in-out infinite' }}
        />
      )}
      <style>{`@keyframes taskapp-page-fetch { 0% { left: -33%; } 100% { left: 100%; } }`}</style>
    </div>
  );
}
