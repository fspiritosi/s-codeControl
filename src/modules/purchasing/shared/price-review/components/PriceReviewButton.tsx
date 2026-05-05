'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  reviewPurchaseOrderPrices,
  reviewPurchaseInvoicePrices,
  applyPurchaseOrderPriceUpdates,
  applyPurchaseInvoicePriceUpdates,
  type PriceDifference,
} from '../actions.server';
import { PriceReviewDialog } from './PriceReviewDialog';

interface Props {
  documentId: string;
  type: 'order' | 'invoice';
}

export function PriceReviewButton({ documentId, type }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [differences, setDifferences] = useState<PriceDifference[]>([]);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    setDifferences([]);
    try {
      const result =
        type === 'order'
          ? await reviewPurchaseOrderPrices(documentId)
          : await reviewPurchaseInvoicePrices(documentId);
      if (result.error) {
        toast.error(result.error);
        setOpen(false);
        return;
      }
      setDifferences(result.differences);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al revisar precios');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (lineIds: string[]) => {
    setApplying(true);
    try {
      const result =
        type === 'order'
          ? await applyPurchaseOrderPriceUpdates(documentId, lineIds)
          : await applyPurchaseInvoicePriceUpdates(documentId, lineIds);
      if (!result.ok) {
        toast.error(result.error || 'No se pudo actualizar');
        return;
      }
      toast.success(`Precios actualizados (${lineIds.length})`);
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar precios');
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleOpen}>
        <RefreshCw className="size-4 mr-1" /> Revisar precios
      </Button>
      <PriceReviewDialog
        open={open}
        onOpenChange={(v) => {
          if (!applying) setOpen(v);
        }}
        differences={differences}
        loading={loading}
        applying={applying}
        onApply={handleApply}
      />
    </>
  );
}
