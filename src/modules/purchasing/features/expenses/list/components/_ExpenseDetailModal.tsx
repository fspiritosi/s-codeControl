'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format, isBefore, startOfDay } from 'date-fns';
import { CheckCircle, XCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
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
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/lib/utils';

import { getExpenseById, confirmExpense, cancelExpense } from '../../actions.server';
import { EXPENSE_STATUS_LABELS } from '../../validators';

type ExpenseDetail = Awaited<ReturnType<typeof getExpenseById>>;

type BadgeVariant = 'secondary' | 'default' | 'outline' | 'destructive';

const STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  DRAFT: 'secondary',
  CONFIRMED: 'default',
  PARTIAL_PAID: 'outline',
  PAID: 'default',
  CANCELLED: 'destructive',
};

interface ExpenseDetailModalProps {
  expenseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function _ExpenseDetailModal({
  expenseId,
  open,
  onOpenChange,
  onSuccess,
}: ExpenseDetailModalProps) {
  const router = useRouter();
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadExpense = useCallback(async () => {
    if (!expenseId) return;

    setLoading(true);
    try {
      const data = await getExpenseById(expenseId);
      setExpense(data);
    } catch (error) {
      console.error('Error al cargar gasto:', error);
      toast.error('Error al cargar el detalle del gasto');
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    if (open && expenseId) {
      loadExpense();
    } else if (!open) {
      setExpense(null);
    }
  }, [open, expenseId, loadExpense]);

  const handleConfirm = async () => {
    if (!expense) return;

    setIsProcessing(true);
    try {
      await confirmExpense(expense.id);
      toast.success('Gasto confirmado correctamente');
      setConfirmDialogOpen(false);
      router.refresh();
      onSuccess?.();
      await loadExpense();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al confirmar gasto');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!expense) return;

    setIsProcessing(true);
    try {
      await cancelExpense(expense.id);
      toast.success('Gasto cancelado correctamente');
      setCancelDialogOpen(false);
      router.refresh();
      onSuccess?.();
      await loadExpense();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cancelar gasto');
    } finally {
      setIsProcessing(false);
    }
  };

  const isDraft = expense?.status === 'DRAFT';
  const isConfirmed = expense?.status === 'CONFIRMED';
  const canCancel = isDraft || isConfirmed;
  const hasPayments = (expense?.payment_order_items?.length ?? 0) > 0;
  const isPaid = expense?.status === 'PAID';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Gasto</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : expense ? (
            <div className="space-y-4">
              {/* Informacion General */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">Informacion General</CardTitle>
                    <Badge
                      variant={STATUS_BADGE_VARIANTS[expense.status] ?? 'default'}
                      className={cn(isPaid && 'bg-green-600 hover:bg-green-700 text-white')}
                    >
                      {EXPENSE_STATUS_LABELS[expense.status] ?? expense.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Numero</p>
                      <p className="font-medium font-mono">{expense.full_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Categoria</p>
                      <p className="font-medium">{expense.category.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha</p>
                      <p className="font-medium">{format(new Date(expense.date), 'dd/MM/yyyy')}</p>
                    </div>
                    {expense.due_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">Vencimiento</p>
                        <p
                          className={cn(
                            'font-medium',
                            !isPaid &&
                              expense.status !== 'CANCELLED' &&
                              isBefore(new Date(expense.due_date), startOfDay(new Date())) &&
                              'text-red-600',
                          )}
                        >
                          {format(new Date(expense.due_date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Descripcion</p>
                      <p className="font-medium">{expense.description}</p>
                    </div>
                    {expense.supplier && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Proveedor</p>
                        <p className="font-medium">{expense.supplier.business_name}</p>
                        {expense.supplier.tax_id && (
                          <p className="text-xs text-muted-foreground">
                            CUIT: {expense.supplier.tax_id}
                          </p>
                        )}
                      </div>
                    )}
                    {expense.notes && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Notas</p>
                        <p className="text-sm">{expense.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resumen de Pagos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resumen Financiero</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monto Total</span>
                      <span className="font-medium font-mono">
                        $
                        {expense.amount.toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pagado</span>
                      <span className="font-medium font-mono text-green-600">
                        -$
                        {expense.paidAmount.toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Pendiente</span>
                      <span
                        className={cn(
                          'font-bold text-lg font-mono',
                          expense.pendingAmount > 0 ? 'text-orange-600' : 'text-green-600',
                        )}
                      >
                        $
                        {expense.pendingAmount.toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ordenes de Pago Vinculadas */}
              {expense.payment_order_items.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Ordenes de Pago</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {expense.payment_order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.payment_order.full_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.payment_order.date), 'dd/MM/yyyy')}{' '}
                              &middot; {item.payment_order.status}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium font-mono">
                              $
                              {item.amount.toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Adjuntos */}
              {expense.expense_attachments.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Adjuntos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {expense.expense_attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between py-1 text-sm"
                        >
                          <span className="truncate">{att.file_name}</span>
                          {att.file_size && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {(att.file_size / 1024).toFixed(0)} KB
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Acciones */}
              <div className="flex justify-end gap-2 pt-2">
                {isDraft && (
                  <Button
                    variant="default"
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar
                  </Button>
                )}
                {canCancel && !hasPayments && (
                  <Button
                    variant="destructive"
                    onClick={() => setCancelDialogOpen(true)}
                    disabled={isProcessing}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar Gasto
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              Al confirmar el gasto {expense?.full_number}, quedara registrado como confirmado y
              podra ser incluido en una orden de pago. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing ? 'Confirmando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que deseas cancelar el gasto {expense?.full_number}? Esta accion no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Cancelando...' : 'Cancelar Gasto'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
