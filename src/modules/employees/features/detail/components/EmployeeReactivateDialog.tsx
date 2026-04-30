'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { reactivateEmployeeByDocNumber } from '@/modules/employees/features/create/actions.server';

interface Props {
  documentNumber: string;
  fullName: string;
  reasonForTermination?: string | null;
  terminationDate?: string | Date | null;
  dateOfAdmission?: string | Date | null;
}

export function EmployeeReactivateDialog({
  documentNumber,
  fullName,
  reasonForTermination,
  terminationDate,
  dateOfAdmission,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [admissionMode, setAdmissionMode] = useState<'keep' | 'new'>('keep');
  const [newAdmissionDate, setNewAdmissionDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );

  const fmt = (d?: string | Date | null) => (d ? format(new Date(d), 'dd/MM/yyyy') : '—');

  const handleConfirm = () => {
    startTransition(async () => {
      const dateOverride = admissionMode === 'new' ? newAdmissionDate : null;
      const result = await reactivateEmployeeByDocNumber(documentNumber, dateOverride);

      if (result?.error) {
        toast.error('Error al reintegrar al empleado', { description: result.error });
        return;
      }

      toast.success('Empleado reintegrado', {
        description: `${fullName} fue reintegrado correctamente.`,
      });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
      <AlertDialogTrigger asChild>
        <Button variant="default">
          <RefreshCw className="size-4 mr-2" /> Reactivar empleado
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reactivar empleado</AlertDialogTitle>
          <AlertDialogDescription>
            {`Estás a punto de reintegrar al empleado ${fullName}, dado de baja por ${reasonForTermination ?? '—'} el día ${fmt(terminationDate)}. Se limpiarán los datos de baja.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm font-medium">Fecha de alta</p>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="employeeReactivateAdmission"
                value="keep"
                checked={admissionMode === 'keep'}
                onChange={() => setAdmissionMode('keep')}
              />
              <span>Mantener fecha original ({fmt(dateOfAdmission)})</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="employeeReactivateAdmission"
                value="new"
                checked={admissionMode === 'new'}
                onChange={() => setAdmissionMode('new')}
              />
              <span>Asignar nueva fecha de alta</span>
            </label>
            {admissionMode === 'new' && (
              <input
                type="date"
                value={newAdmissionDate}
                onChange={(e) => setNewAdmissionDate(e.target.value)}
                className="ml-6 rounded-md border px-2 py-1 text-sm w-fit"
              />
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Reintegrando...
              </>
            ) : (
              'Continuar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
