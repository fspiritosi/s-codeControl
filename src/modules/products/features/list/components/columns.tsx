'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
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
import { PRODUCT_TYPE_LABELS, PRODUCT_STATUS_LABELS, type Product } from '@/modules/products/shared/types';
import { MoreHorizontal, Pencil, Power, PowerOff, Eye } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteProduct, updateProduct } from '../actions.server';

function ActionsCell({ product }: { product: Product }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isActive = product.status === 'ACTIVE';

  const handleToggle = () => {
    startTransition(async () => {
      const result = isActive
        ? await deleteProduct(product.id)
        : await updateProduct(product.id, {
            name: product.name,
            description: product.description,
            type: product.type,
            unit_of_measure: product.unit_of_measure,
            cost_price: product.cost_price,
            sale_price: product.sale_price,
            vat_rate: product.vat_rate,
            track_stock: product.track_stock,
            min_stock: product.min_stock,
            max_stock: product.max_stock,
            barcode: product.barcode,
            brand: product.brand,
            status: 'ACTIVE',
          });

      if (result.error) {
        toast.error(typeof result.error === 'string' ? result.error : 'Error al actualizar producto');
        return;
      }
      toast.success(isActive ? 'Producto desactivado' : 'Producto activado');
      setConfirmOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/products/${product.id}`}>
              <Eye className="size-4 mr-2" /> Ver detalle
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/products/${product.id}/edit`}>
              <Pencil className="size-4 mr-2" /> Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setConfirmOpen(true); }}>
            {isActive ? (
              <>
                <PowerOff className="size-4 mr-2" /> Desactivar
              </>
            ) : (
              <>
                <Power className="size-4 mr-2" /> Activar
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={(v) => !isPending && setConfirmOpen(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? '¿Desactivar producto?' : '¿Activar producto?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? `El producto "${product.name}" dejará de aparecer en los selectores. Podés reactivarlo más tarde.`
                : `El producto "${product.name}" volverá a estar disponible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle} disabled={isPending}>
              {isPending ? 'Procesando...' : isActive ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function buildProductColumns({ showCompany }: { showCompany: boolean }): ColumnDef<Product>[] {
  const cols: ColumnDef<Product>[] = [
  {
    accessorKey: 'code',
    header: 'Código',
    meta: { title: 'Código' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
    meta: { title: 'Nombre' },
    cell: ({ row }) => (
      <Link href={`/dashboard/products/${row.original.id}`} className="block hover:underline">
        <p className="font-medium">{row.original.name}</p>
        {row.original.description && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.original.description}</p>
        )}
      </Link>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    meta: { title: 'Tipo' },
    cell: ({ row }) => <Badge variant="outline">{PRODUCT_TYPE_LABELS[row.original.type] || row.original.type}</Badge>,
    filterFn: 'equals',
  },
  {
    accessorKey: 'unit_of_measure',
    header: 'Unidad',
    meta: { title: 'Unidad' },
  },
  {
    accessorKey: 'cost_price',
    header: 'Costo',
    meta: { title: 'Costo' },
    cell: ({ row }) => <span>${row.original.cost_price.toFixed(2)}</span>,
  },
  {
    accessorKey: 'sale_price',
    header: 'Venta',
    meta: { title: 'Venta' },
    cell: ({ row }) => <span>${row.original.sale_price.toFixed(2)}</span>,
  },
  {
    accessorKey: 'track_stock',
    header: 'Stock',
    meta: { title: 'Stock' },
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.track_stock ? `Min: ${row.original.min_stock ?? 0}` : 'No controlado'}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    meta: { title: 'Estado' },
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
          {PRODUCT_STATUS_LABELS[status] || status}
        </Badge>
      );
    },
    filterFn: 'equals',
  },
  {
    id: 'actions',
    header: '',
    meta: { excludeFromExport: true },
    cell: ({ row }) => <ActionsCell product={row.original} />,
  },
  ];

  if (showCompany) {
    cols.splice(cols.length - 1, 0, {
      id: 'company_name',
      header: 'Empresa',
      meta: { title: 'Empresa' },
      cell: ({ row }) => (
        <span className="text-sm">{(row.original as any).company?.company_name ?? '-'}</span>
      ),
    });
  }

  return cols;
}

// Compatibilidad con consumidores existentes (sin grupo).
export const productColumns: ColumnDef<Product>[] = buildProductColumns({ showCompany: false });
