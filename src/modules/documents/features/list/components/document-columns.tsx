'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/shared/components/common/DataTable';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { DocumentRowActions } from './DocumentRowActions';

const stateVariantMap: Record<
  string,
  'destructive' | 'success' | 'default' | 'yellow'
> = {
  vencido: 'yellow',
  rechazado: 'destructive',
  aprobado: 'success',
  presentado: 'default',
  pendiente: 'destructive',
};

export const permanentDocumentColumns: ColumnDef<any>[] = [
  {
    id: 'actions',
    meta: { excludeFromExport: true },
    cell: ({ row }) => <DocumentRowActions row={row} />,
    enableHiding: false,
  },
  {
    accessorKey: 'resource',
    meta: { title: 'Empleado' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Empleado" />,
    cell: ({ row }) => (
      <Link
        href={`/dashboard/employee/action?action=view&employee_id=${row.original.employee_id}`}
        className="hover:underline font-medium"
      >
        {row.original.resource}
      </Link>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'documentName',
    meta: { title: 'Documento' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Documento" />,
    enableSorting: true,
  },
  {
    accessorKey: 'allocated_to',
    meta: { title: 'Afectado a' },
    header: 'Afectado a',
    cell: ({ row }) => {
      const value = row.original.allocated_to;
      if (!value) return <Badge variant="outline">Sin afectar</Badge>;
      return <span>{value}</span>;
    },
  },
  {
    accessorKey: 'mandatory',
    meta: { title: 'Obligatorio' },
    header: 'Obligatorio',
  },
  {
    accessorKey: 'state',
    meta: { title: 'Estado' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const value = (row.original.state as string) || '';
      const variant = stateVariantMap[value.toLowerCase()] ?? 'default';
      return <Badge variant={variant}>{value}</Badge>;
    },
    filterFn: (row, id, value) => {
      if (Array.isArray(value)) return value.includes(row.getValue(id));
      if (!value) return true;
      return String(row.getValue(id)).toLowerCase() === String(value).toLowerCase();
    },
    enableSorting: true,
  },
  {
    accessorKey: 'multiresource',
    meta: { title: 'Multi recurso' },
    header: 'Multi recurso',
  },
  {
    accessorKey: 'validity',
    meta: { title: 'Vencimiento' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimiento" />,
    cell: ({ row }) => {
      const value = row.original.validity;
      if (!value) return <Badge variant="outline">No vence</Badge>;
      return format(new Date(value), 'dd/MM/yyyy');
    },
    enableSorting: true,
  },
  {
    accessorKey: 'date',
    meta: { title: 'Subido el' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subido el" />,
    enableSorting: true,
  },
  {
    accessorKey: 'id',
    meta: { title: 'Accion', excludeFromExport: true },
    header: 'Accion',
    cell: ({ row }) => {
      const isPending = row.original.state?.toLowerCase() === 'pendiente';
      if (isPending) {
        return (
          <Link href={`/dashboard/document/${row.original.id}?resource=${row.original.applies}`}>
            <Button variant="outline" size="sm">
              Subir documento
            </Button>
          </Link>
        );
      }
      return (
        <Link href={`/dashboard/document/${row.original.id}?resource=${row.original.applies}`}>
          <Button variant="default" size="sm">
            Ver documento
          </Button>
        </Link>
      );
    },
  },
];

export const monthlyDocumentColumns: ColumnDef<any>[] = [
  {
    id: 'actions',
    meta: { excludeFromExport: true },
    cell: ({ row }) => <DocumentRowActions row={row} />,
    enableHiding: false,
  },
  {
    accessorKey: 'resource',
    meta: { title: 'Empleado' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Empleado" />,
    cell: ({ row }) => (
      <Link
        href={`/dashboard/employee/action?action=view&employee_id=${row.original.employee_id}`}
        className="hover:underline font-medium"
      >
        {row.original.resource}
      </Link>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'documentName',
    meta: { title: 'Documento' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Documento" />,
    enableSorting: true,
  },
  {
    accessorKey: 'allocated_to',
    meta: { title: 'Afectado a' },
    header: 'Afectado a',
    cell: ({ row }) => {
      const value = row.original.allocated_to;
      if (!value) return <Badge variant="outline">Sin afectar</Badge>;
      return <span>{value}</span>;
    },
  },
  {
    accessorKey: 'mandatory',
    meta: { title: 'Obligatorio' },
    header: 'Obligatorio',
  },
  {
    accessorKey: 'state',
    meta: { title: 'Estado' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const value = (row.original.state as string) || '';
      const variant = stateVariantMap[value.toLowerCase()] ?? 'default';
      return <Badge variant={variant}>{value}</Badge>;
    },
    filterFn: (row, id, value) => {
      if (Array.isArray(value)) return value.includes(row.getValue(id));
      if (!value) return true;
      return String(row.getValue(id)).toLowerCase() === String(value).toLowerCase();
    },
    enableSorting: true,
  },
  {
    accessorKey: 'multiresource',
    meta: { title: 'Multi recurso' },
    header: 'Multi recurso',
  },
  {
    accessorKey: 'period',
    meta: { title: 'Periodo' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Periodo" />,
    cell: ({ row }) => {
      const value = row.original.period;
      if (!value) return 'No disponible';
      const [year, month] = value.split('-');
      return `${month}/${year}`;
    },
    enableSorting: true,
  },
  {
    accessorKey: 'validity',
    meta: { title: 'Vencimiento' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimiento" />,
    cell: ({ row }) => {
      const value = row.original.validity;
      if (!value) return <Badge variant="outline">No vence</Badge>;
      return format(new Date(value), 'dd/MM/yyyy');
    },
    enableSorting: true,
  },
  {
    accessorKey: 'date',
    meta: { title: 'Subido el' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subido el" />,
    enableSorting: true,
  },
  {
    accessorKey: 'id',
    meta: { title: 'Accion', excludeFromExport: true },
    header: 'Accion',
    cell: ({ row }) => {
      const isPending = row.original.state?.toLowerCase() === 'pendiente';
      if (isPending) {
        return (
          <Link href={`/dashboard/document/${row.original.id}?resource=${row.original.applies}`}>
            <Button variant="outline" size="sm">
              Subir documento
            </Button>
          </Link>
        );
      }
      return (
        <Link href={`/dashboard/document/${row.original.id}?resource=${row.original.applies}`}>
          <Button variant="default" size="sm">
            Ver documento
          </Button>
        </Link>
      );
    },
  },
];
