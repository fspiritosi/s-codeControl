import { ArrowDown, ArrowUp, Equal, Flame, type LucideIcon } from 'lucide-react';
import type { TicketPriority } from '@/shared/lib/taskapp/types';

export type PrioritySlug = TicketPriority;

export interface PriorityDef {
  slug: PrioritySlug;
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  iconClass: string;
}

export const PRIORITY_BY_SLUG: Record<PrioritySlug, PriorityDef> = {
  low: {
    slug: 'low',
    label: 'Baja',
    icon: ArrowDown,
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    iconClass: 'text-slate-500',
  },
  medium: {
    slug: 'medium',
    label: 'Media',
    icon: Equal,
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    iconClass: 'text-blue-500',
  },
  high: {
    slug: 'high',
    label: 'Alta',
    icon: ArrowUp,
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    iconClass: 'text-amber-500',
  },
  critical: {
    slug: 'critical',
    label: 'Crítica',
    icon: Flame,
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    iconClass: 'text-red-600',
  },
};

export const PRIORITIES: PriorityDef[] = Object.values(PRIORITY_BY_SLUG);

export function priorityFor(slug: string | undefined): PriorityDef {
  if (slug && slug in PRIORITY_BY_SLUG) return PRIORITY_BY_SLUG[slug as PrioritySlug];
  return PRIORITY_BY_SLUG.medium;
}
