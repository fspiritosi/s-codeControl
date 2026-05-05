'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import Link from 'next/link';
import { BadgeCheck, CheckCircle, Download, Pencil, XCircle } from 'lucide-react';
import {
  cancelPaymentOrder,
  confirmPaymentOrder,
  markPaymentOrderAsPaid,
} from '../actions.server';

interface Props {
  id: string;
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
}

export function PaymentOrderActions({ id, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmPaidOpen, setConfirmPaidOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmPaymentOrder(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Orden confirmada');
      router.refresh();
    });
  };

  const handleCancel = () => {
    setCancelOpen(false);
    startTransition(async () => {
      const result = await cancelPaymentOrder(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Orden anulada');
      router.refresh();
    });
  };

  const handleMarkPaid = () => {
    setConfirmPaidOpen(false);
    startTransition(async () => {
      const result = await markPaymentOrderAsPaid(id);
      if (!result.ok) {
        toast.error(result.error || 'No se pudo marcar como pagada');
        return;
      }
      if (result.emailStatus === 'SENT') {
        toast.success('OP marcada como pagada y notificada al proveedor.');
      } else if (result.emailStatus === 'NO_EMAIL') {
        toast.warning(
          'OP marcada como pagada. El proveedor no tiene email cargado, no se envió notificación.'
        );
      } else {
        toast.warning(
          `OP marcada como pagada. No se pudo enviar el mail${result.errorMessage ? ` (${result.errorMessage})` : ''}.`
        );
      }
      router.refresh();
    });
  };

  const isTerminal = status === 'CANCELLED' || status === 'PAID';

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" asChild>
        <a href={`/api/payment-orders/${id}/pdf`} target="_blank" rel="noopener noreferrer">
          <Download className="size-4 mr-1" />
          Descargar PDF
        </a>
      </Button>
      {status === 'DRAFT' && (
        <>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/dashboard/treasury/payment-orders/${id}/edit`}>
              <Pencil className="size-4 mr-1" />
              Editar
            </Link>
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={isPending}>
            <CheckCircle className="size-4 mr-1" />
            Confirmar
          </Button>
        </>
      )}
      {status === 'CONFIRMED' && (
        <Button
          size="sm"
          onClick={() => setConfirmPaidOpen(true)}
          disabled={isPending}
        >
          <BadgeCheck className="size-4 mr-1" />
          Marcar como Pagada
        </Button>
      )}
      {!isTerminal && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setCancelOpen(true)}
          disabled={isPending}
        >
          <XCircle className="size-4 mr-1" />
          Anular
        </Button>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular orden de pago</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a anular la OP. Las facturas asociadas quedarán liberadas para nuevas
              OPs. Si la OP estaba confirmada, los movimientos de tesorería generados
              serán revertidos. Esta acción no se puede revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmPaidOpen} onOpenChange={setConfirmPaidOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar orden como pagada</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a marcar la OP como Pagada. Las facturas asociadas se actualizarán
              y se enviará un mail al proveedor. Esta acción no se puede revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkPaid}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
