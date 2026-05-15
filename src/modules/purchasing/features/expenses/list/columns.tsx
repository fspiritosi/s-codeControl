'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Edit, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/shared/components/common/DataTable';
import { EXPENSE_STATUS_LABELS } from '../validators';

export type ExpenseListItem = {
  id: string;
  number: number;
  full_number: string;
  description: string;
  amount: number;
  date: Date;
  due_date: Date | null;
  status: string;
  created_at: Date;
  category: { id: string; name: string };
  supplier: { id: string; business_name: string } | null;
  _count: { expense_attachments: number; payment_order_items: number };
} & Record<string, unknown>;

type BadgeVariant = 'secondary' | 'default' | 'outline' | 'destructive';

const STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  DRAFT: 'secondary',
  CONFIRMED: 'default',
  PARTIAL_PAID: 'outline',
  PAID: 'default',
  CANCELLED: 'destructive',
};

interface ColumnsProps {
  onViewDetail: (expense: ExpenseListItem) => void;
  onEdit?: (expense: ExpenseListItem) => void;
  onConfirm?: (expense: ExpenseListItem) => void;
  onCancel?: (expense: ExpenseListItem) => void;
  onDelete?: (expense: ExpenseListItem) => void;
}

export function getExpenseColumns({
  onViewDetail,
  onEdit,
  onConfirm,
  onCancel,
  onDelete,
}: ColumnsProps): ColumnDef<ExpenseListItem>[] {
  return [
    {
      accessorKey: 'full_number',
      meta: { title: 'Numero' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Numero" />,
      cell: ({ row }) => (
        <button
          type="button"
          className="font-mono font-medium text-primary hover:underline cursor-pointer"
          onClick={() => onViewDetail(row.original)}
        >
          {row.original.full_number}
        </button>
      ),
    },
    {
      accessorKey: 'description',
      meta: { title: 'Descripcion' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Descripcion" />,
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block" title={row.original.description}>
          {row.original.description}
        </span>
      ),
    },
    {
      id: 'category_id',
      accessorFn: (row) => row.category.name,
      meta: { title: 'Categoria' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" />,
      cell: ({ row }) => row.original.category.name,
    },
    {
      id: 'supplier',
      accessorFn: (row) => row.supplier?.business_name ?? '',
      meta: { title: 'Proveedor' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Proveedor" />,
      cell: ({ row }) => {
        const supplier = row.original.supplier;
        if (!supplier) return <span className="text-muted-foreground">-</span>;
        return supplier.business_name;
      },
    },
    {
      accessorKey: 'date',
      meta: { title: 'Fecha' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
      cell: ({ row }) => format(new Date(row.original.date), 'dd/MM/yyyy'),
    },
    {
      accessorKey: 'due_date',
      meta: { title: 'Vencimiento' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimiento" />,
      cell: ({ row }) => {
        const { due_date, status } = row.original;
        if (!due_date) return <span className="text-muted-foreground">-</span>;

        const isOverdue =
          status !== 'PAID' &&
          status !== 'CANCELLED' &&
          isBefore(new Date(due_date), startOfDay(new Date()));

        return (
          <span className={isOverdue ? 'text-red-600 font-medium' : undefined}>
            {format(new Date(due_date), 'dd/MM/yyyy')}
          </span>
        );
      },
    },
    {
      accessorKey: 'amount',
      meta: { title: 'Monto' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" />,
      cell: ({ row }) => (
        <span className="font-mono font-medium text-right block">
          ${row.original.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      meta: { title: 'Estado' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
      cell: ({ row }) => {
        const status = row.original.status;
        const isPaid = status === 'PAID';

        return (
          <Badge
            variant={STATUS_BADGE_VARIANTS[status] ?? 'default'}
            className={isPaid ? 'bg-green-600 hover:bg-green-700 text-white' : undefined}
          >
            {EXPENSE_STATUS_LABELS[status] ?? status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const expense = row.original;
        const isDraft = expense.status === 'DRAFT';
        const canCancel = expense.status === 'DRAFT' || expense.status === 'CONFIRMED';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetail(expense)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>

              {isDraft && onEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit(expense)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                </>
              )}

              {isDraft && onConfirm && (
                <DropdownMenuItem onClick={() => onConfirm(expense)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar
                </DropdownMenuItem>
              )}

              {canCancel && onCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onCancel(expense)} className="text-destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar
                  </DropdownMenuItem>
                </>
              )}

              {isDraft && onDelete && (
                <DropdownMenuItem onClick={() => onDelete(expense)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
