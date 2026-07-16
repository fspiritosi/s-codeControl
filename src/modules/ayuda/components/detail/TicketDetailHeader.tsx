import { SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Ticket } from '@/shared/lib/taskapp/types';
import { parseCategoryFromTitle } from '../../constants/categories';
import { TicketCategoryBadge } from '../TicketCategoryBadge';
import { TicketPriorityBadge } from '../TicketPriorityBadge';
import { TicketStatusBadge } from '../TicketStatusBadge';

interface Props {
  ticket: Ticket;
}

export function TicketDetailHeader({ ticket }: Props) {
  const { categoryLabel, cleanTitle } = parseCategoryFromTitle(ticket.title);
  return (
    <SheetHeader className="border-b p-6">
      <SheetTitle className="text-lg leading-snug">{cleanTitle}</SheetTitle>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {categoryLabel && <TicketCategoryBadge label={categoryLabel} />}
        <TicketStatusBadge slug={ticket.status?.slug} name={ticket.status?.name} />
        <TicketPriorityBadge slug={ticket.priority} />
        {ticket.estimated_hours != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {ticket.estimated_hours} hs estimadas
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          Creado {format(new Date(ticket.created_at), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
        </span>
      </div>
    </SheetHeader>
  );
}
