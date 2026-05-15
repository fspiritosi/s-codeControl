'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  DataTable,
  type DataTableSearchParams,
  type DataTableFacetedFilterConfig,
} from '@/shared/components/common/DataTable';
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

import { confirmExpense, cancelExpense, deleteExpense, getAllExpensesForExport } from '../../actions.server';
import { getExpenseColumns, type ExpenseListItem } from '../columns';
import { EXPENSE_STATUS_LABELS } from '../../validators';
import { _CreateExpenseModal } from './_CreateExpenseModal';
import { _ExpenseDetailModal } from './_ExpenseDetailModal';

interface FacetCounts {
  status?: { value: string; count: number }[];
  category_id?: { value: string; count: number }[];
}

interface CategoryOption {
  id: string;
  name: string;
}

interface Props {
  data: ExpenseListItem[];
  totalRows: number;
  searchParams: DataTableSearchParams;
  facetCounts?: FacetCounts;
  categories?: CategoryOption[];
}

export function _ExpensesDataTable({
  data,
  totalRows,
  searchParams,
  facetCounts,
  categories = [],
}: Props) {
  const router = useRouter();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseListItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!selectedExpense) return;

    setIsProcessing(true);
    try {
      await confirmExpense(selectedExpense.id);
      toast.success('Gasto confirmado correctamente');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al confirmar gasto');
    } finally {
      setIsProcessing(false);
      setConfirmDialogOpen(false);
      setSelectedExpense(null);
    }
  };

  const handleCancel = async () => {
    if (!selectedExpense) return;

    setIsProcessing(true);
    try {
      await cancelExpense(selectedExpense.id);
      toast.success('Gasto cancelado correctamente');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cancelar gasto');
    } finally {
      setIsProcessing(false);
      setCancelDialogOpen(false);
      setSelectedExpense(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;

    setIsProcessing(true);
    try {
      await deleteExpense(selectedExpense.id);
      toast.success('Gasto eliminado correctamente');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar gasto');
    } finally {
      setIsProcessing(false);
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
    }
  };

  const facetedFilters: DataTableFacetedFilterConfig[] = useMemo(
    () => [
      {
        columnId: 'full_number',
        title: 'Numero',
        type: 'text' as const,
        placeholder: 'Buscar por numero...',
      },
      {
        columnId: 'description',
        title: 'Descripcion',
        type: 'text' as const,
        placeholder: 'Buscar por descripcion...',
      },
      {
        columnId: 'supplier',
        title: 'Proveedor',
        type: 'text' as const,
        placeholder: 'Buscar por proveedor...',
      },
      {
        columnId: 'status',
        title: 'Estado',
        options: Object.entries(EXPENSE_STATUS_LABELS).map(([value, label]) => ({
          label,
          value,
        })),
        externalCounts: facetCounts?.status
          ? new Map(facetCounts.status.map((f) => [f.value, f.count]))
          : undefined,
      },
      {
        columnId: 'category_id',
        title: 'Categoria',
        options: categories.map((c) => ({
          value: c.id,
          label: c.name,
        })),
        externalCounts: facetCounts?.category_id
          ? new Map(facetCounts.category_id.map((f) => [f.value, f.count]))
          : undefined,
      },
      {
        columnId: 'date',
        title: 'Fecha',
        type: 'dateRange' as const,
      },
      {
        columnId: 'due_date',
        title: 'Vencimiento',
        type: 'dateRange' as const,
      },
    ],
    [facetCounts, categories],
  );

  const columns = useMemo(
    () =>
      getExpenseColumns({
        onViewDetail: (expense) => {
          setSelectedExpense(expense);
          setDetailModalOpen(true);
        },
        onEdit: (expense) => {
          setSelectedExpense(expense);
          setEditModalOpen(true);
        },
        onConfirm: (expense) => {
          setSelectedExpense(expense);
          setConfirmDialogOpen(true);
        },
        onCancel: (expense) => {
          setSelectedExpense(expense);
          setCancelDialogOpen(true);
        },
        onDelete: (expense) => {
          setSelectedExpense(expense);
          setDeleteDialogOpen(true);
        },
      }),
    [],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalRows={totalRows}
        searchParams={searchParams}
        searchPlaceholder="Buscar por numero, descripcion, proveedor o categoria..."
        facetedFilters={facetedFilters}
        tableId="expenses-list"
        showFilterToggle
        toolbarActions={<_CreateExpenseModal onSuccess={() => router.refresh()} />}
        exportConfig={{
          fetchAllData: () => getAllExpensesForExport() as any,
          options: {
            filename: 'gastos',
            sheetName: 'Gastos',
            title: 'Listado de Gastos',
            includeDate: true,
          },
        }}
      />

      {/* Dialogo de Confirmacion */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              Al confirmar el gasto {selectedExpense?.full_number}, quedara registrado como
              confirmado y podra ser incluido en una orden de pago. Esta accion no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing ? 'Confirmando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogo de Cancelacion */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que deseas cancelar el gasto {selectedExpense?.full_number}? Solo se
              pueden cancelar gastos sin pagos confirmados. Esta accion no se puede deshacer.
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

      {/* Dialogo de Eliminacion */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara permanentemente el gasto {selectedExpense?.full_number} y todos
              sus registros asociados. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Detalle */}
      <_ExpenseDetailModal
        expenseId={selectedExpense?.id ?? null}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onSuccess={() => router.refresh()}
      />

      {/* Modal de Edicion */}
      {editModalOpen && selectedExpense && (
        <_CreateExpenseModal
          expenseId={selectedExpense.id}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={() => {
            setEditModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
