'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  auditPendingDocumentsForEmployees,
  auditPendingDocumentsForEquipment,
  confirmPendingDocumentsForEmployees,
  confirmPendingDocumentsForEquipment,
} from '../actions.server';
import type { PendingAuditResult } from '@/shared/lib/documentAlerts';

interface Props {
  kind: 'employees' | 'equipment';
}

const LABELS = {
  employees: {
    button: 'Auditar alertas de Empleados',
    title: 'Auditoría de alertas — Empleados',
    description:
      'Detecta documentos obligatorios que deberían estar pendientes pero faltan. Nada se crea hasta que confirmes.',
    affected: (n: number) => `${n} ${n === 1 ? 'empleado' : 'empleados'}`,
  },
  equipment: {
    button: 'Auditar alertas de Equipos',
    title: 'Auditoría de alertas — Equipos',
    description:
      'Detecta documentos obligatorios que deberían estar pendientes pero faltan. Nada se crea hasta que confirmes.',
    affected: (n: number) => `${n} ${n === 1 ? 'equipo' : 'equipos'}`,
  },
} as const;

export function AuditAlertsButton({ kind }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isAuditing, startAudit] = useTransition();
  const [isConfirming, startConfirm] = useTransition();
  const [result, setResult] = useState<PendingAuditResult | null>(null);

  const labels = LABELS[kind];

  const handleAudit = () => {
    setOpen(true);
    setResult(null);
    startAudit(async () => {
      const audit =
        kind === 'employees'
          ? await auditPendingDocumentsForEmployees()
          : await auditPendingDocumentsForEquipment();
      setResult(audit);
    });
  };

  const handleConfirm = () => {
    if (!result) return;
    const ids = result.entries.map((e) => e.resourceId);
    startConfirm(async () => {
      const r =
        kind === 'employees'
          ? await confirmPendingDocumentsForEmployees(ids)
          : await confirmPendingDocumentsForEquipment(ids);
      toast.success(`Se crearon ${r.created} alertas pendientes`);
      setOpen(false);
      setResult(null);
      router.refresh();
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleAudit} disabled={isAuditing}>
        <ClipboardCheck className="size-4 mr-1.5" />
        {labels.button}
      </Button>

      <Dialog open={open} onOpenChange={(v) => !isConfirming && setOpen(v)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{labels.title}</DialogTitle>
            <DialogDescription>{labels.description}</DialogDescription>
          </DialogHeader>

          {isAuditing || result === null ? (
            <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span>Analizando registros...</span>
            </div>
          ) : result.totalMissing === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-lg font-medium">No se detectaron alertas faltantes.</p>
              <p className="text-sm text-muted-foreground">
                Todos los documentos obligatorios ya están registrados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="default" className="text-base">
                  {result.totalMissing}
                </Badge>
                <span>
                  {result.totalMissing === 1 ? 'alerta faltante' : 'alertas faltantes'} que afecta a{' '}
                  <strong>{labels.affected(result.affectedResources)}</strong>
                </span>
              </div>

              <div className="rounded-md border max-h-[380px] overflow-y-auto">
                <ul className="divide-y">
                  {result.entries.map((entry) => (
                    <li key={entry.resourceId} className="p-3">
                      <div className="font-medium">{entry.resourceLabel}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {entry.missingDocumentTypes.map((t) => (
                          <Badge key={t.id} variant="outline" className="text-xs">
                            {t.name}
                          </Badge>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isConfirming}
            >
              {result?.totalMissing === 0 ? 'Cerrar' : 'Cancelar'}
            </Button>
            {result && result.totalMissing > 0 && (
              <Button onClick={handleConfirm} disabled={isConfirming || isAuditing}>
                {isConfirming ? (
                  <>
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>Confirmar y crear {result.totalMissing} alertas</>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
