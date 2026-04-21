'use client';

import { Button } from '@/shared/components/ui/button';
import { Download } from 'lucide-react';

interface Props {
  orderId: string;
}

export function WithdrawalOrderPDFButton({ orderId }: Props) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => window.open(`/api/withdrawal-orders/${orderId}/pdf`, '_blank')}
    >
      <Download className="size-4 mr-1" /> Descargar PDF
    </Button>
  );
}
