import { Badge } from '@/shared/components/ui/badge';
import { priorityFor } from '../constants/ticket-priority';

interface Props {
  slug: string | undefined;
  showIcon?: boolean;
}

export function TicketPriorityBadge({ slug, showIcon = true }: Props) {
  const def = priorityFor(slug);
  const Icon = def.icon;
  return (
    <Badge variant="outline" className={`border-transparent ${def.badgeClass}`}>
      {showIcon && <Icon className={`mr-1 h-3 w-3 ${def.iconClass}`} />}
      {def.label}
    </Badge>
  );
}
