'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { PRIORITIES, type PrioritySlug } from '../constants/ticket-priority';

interface Props {
  value: PrioritySlug;
  onChange: (value: PrioritySlug) => void;
  disabled?: boolean;
}

export function TicketPrioritySelect({ value, onChange, disabled }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PrioritySlug)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Elegí una prioridad" />
      </SelectTrigger>
      <SelectContent>
        {PRIORITIES.map((p) => {
          const Icon = p.icon;
          return (
            <SelectItem key={p.slug} value={p.slug}>
              <span className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${p.iconClass}`} />
                {p.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
