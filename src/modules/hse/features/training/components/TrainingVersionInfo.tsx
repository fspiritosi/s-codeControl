import { Badge } from '@/shared/components/ui/badge';
import Link from 'next/link';

type VersionInfo = {
  version_number?: number;
  previousVersion?: { version_number: number; closed_at: string | null; approved: number } | null;
  draftVersion?: { id: string; version_number: number } | null;
};

const formatDayMonth = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) : '—';

/** Número de versión y vínculos con las vecinas en la tarjeta del listado (TKT-827). */
export function TrainingVersionBadge({ training }: { training: VersionInfo }) {
  if (!training.version_number || training.version_number <= 1) return null;
  return <Badge variant="outline">v{training.version_number}</Badge>;
}

export function TrainingVersionLinks({ training }: { training: VersionInfo }) {
  const { previousVersion, draftVersion } = training;
  if (!previousVersion && !draftVersion) return null;

  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      {previousVersion && (
        <p>
          Reemplaza a la v{previousVersion.version_number} (cerrada el {formatDayMonth(previousVersion.closed_at)},{' '}
          {previousVersion.approved} aprobados)
        </p>
      )}
      {draftVersion && (
        <p>
          <Link href={`/dashboard/hse/detail/${draftVersion.id}`} className="underline">
            v{draftVersion.version_number} en preparación
          </Link>
        </p>
      )}
    </div>
  );
}
