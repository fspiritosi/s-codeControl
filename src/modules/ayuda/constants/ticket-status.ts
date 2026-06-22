export interface StatusDef {
  label: string;
  badgeClass: string;
  borderClass: string;
  dotClass: string;
  tintClass: string;
}

export const STATUS_BY_SLUG: Record<string, StatusDef> = {
  open: {
    label: 'Abierto',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    borderClass: 'border-l-blue-500',
    dotClass: 'bg-blue-500',
    tintClass: 'from-blue-500/10',
  },
  pendiente_aprobacion: {
    label: 'Pendiente de aprobación',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    borderClass: 'border-l-yellow-500',
    dotClass: 'bg-yellow-500',
    tintClass: 'from-yellow-500/10',
  },
  aprobado_cliente: {
    label: 'Aprobado',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    borderClass: 'border-l-green-500',
    dotClass: 'bg-green-500',
    tintClass: 'from-green-500/10',
  },
  in_progress: {
    label: 'En curso',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    borderClass: 'border-l-amber-500',
    dotClass: 'bg-amber-500',
    tintClass: 'from-amber-500/10',
  },
  blocked: {
    label: 'Bloqueado',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    borderClass: 'border-l-red-500',
    dotClass: 'bg-red-500',
    tintClass: 'from-red-500/10',
  },
  planned: {
    label: 'Planificado',
    badgeClass: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    borderClass: 'border-l-violet-500',
    dotClass: 'bg-violet-500',
    tintClass: 'from-violet-500/10',
  },
  valued: {
    label: 'Valuado',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    borderClass: 'border-l-orange-500',
    dotClass: 'bg-orange-500',
    tintClass: 'from-orange-500/10',
  },
  pending_planning: {
    label: 'Pendiente de planificación',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
    borderClass: 'border-l-fuchsia-500',
    dotClass: 'bg-fuchsia-500',
    tintClass: 'from-fuchsia-500/10',
  },
  resolved: {
    label: 'Resuelto',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    borderClass: 'border-l-emerald-500',
    dotClass: 'bg-emerald-500',
    tintClass: 'from-emerald-500/10',
  },
  done: {
    label: 'Resuelto',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    borderClass: 'border-l-emerald-500',
    dotClass: 'bg-emerald-500',
    tintClass: 'from-emerald-500/10',
  },
  closed: {
    label: 'Cerrado',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    borderClass: 'border-l-slate-400',
    dotClass: 'bg-slate-400',
    tintClass: 'from-slate-400/10',
  },
  cancelled: {
    label: 'Cancelado',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    borderClass: 'border-l-slate-400',
    dotClass: 'bg-slate-400',
    tintClass: 'from-slate-400/10',
  },
};

export function statusFor(slug: string | undefined, fallbackName?: string): StatusDef {
  if (slug && STATUS_BY_SLUG[slug]) return STATUS_BY_SLUG[slug];
  return {
    label: fallbackName ?? slug ?? 'Desconocido',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    borderClass: 'border-l-slate-400',
    dotClass: 'bg-slate-400',
    tintClass: 'from-slate-400/10',
  };
}
