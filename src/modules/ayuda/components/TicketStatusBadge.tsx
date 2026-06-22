import { Badge } from '@/shared/components/ui/badge';
import { statusFor } from '../constants/ticket-status';

interface Props {
  slug: string | undefined;
  name: string | undefined;
}

export function TicketStatusBadge({ slug, name }: Props) {
  const def = statusFor(slug, name);
  return (
    <Badge variant="outline" className={`border-transparent ${def.badgeClass}`}>
      {def.label}
    </Badge>
  );
}
