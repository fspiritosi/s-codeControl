'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { confirmPaymentOrder, cancelPaymentOrder } from '../actions.server';

interface Props {
  id: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
}

export function PaymentOrderActions({ id, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  if (status === 'CANCELLED') return null;

  return (
    <div className="flex gap-2">
      {status === 'DRAFT' && (
        <Button size="sm" onClick={handleConfirm} disabled={isPending}>
          <CheckCircle className="size-4 mr-1" />
          Confirmar
        </Button>
      )}
      <Button size="sm" variant="destructive" onClick={handleCancel} disabled={isPending}>
        <XCircle className="size-4 mr-1" />
        Anular
      </Button>
    </div>
  );
}
