import { getReporterEmail } from '@/modules/ayuda/actions/getReporterEmail';
import { getMyTicketsWithUnread, getSupportTicketById } from '@/modules/ayuda/actions/support-tickets';
import { HelpCenter } from '@/modules/ayuda/components/HelpCenter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ayuda | CodeControl',
  description: 'Centro de ayuda y soporte',
};

interface SearchParams {
  ticket?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function HelpPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawId = params.ticket ? Number(params.ticket) : null;
  const ticketId = rawId != null && Number.isFinite(rawId) ? rawId : null;

  const [initialTickets, initialTicket, reporter] = await Promise.all([
    getMyTicketsWithUnread(),
    ticketId != null ? getSupportTicketById(ticketId) : Promise.resolve(null),
    getReporterEmail(),
  ]);

  const currentUserEmail = reporter?.email ?? '';
  const currentUserName = reporter?.name ?? reporter?.email ?? 'Usuario';

  return (
    <HelpCenter
      initialTickets={initialTickets}
      initialTicket={initialTicket}
      initialTicketId={ticketId}
      currentUserEmail={currentUserEmail}
      currentUserName={currentUserName}
    />
  );
}
