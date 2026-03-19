'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/shared/components/common/DataTable';
import { Badge } from '@/shared/components/ui/badge';
import { DocumentTypeRowActions } from './DocumentTypeRowActions';

const appliesVariantMap: Record<string, 'default' | 'info' | 'secondary'> = {
  Persona: 'default',
  Equipos: 'info',
  Empresa: 'secondary',
};

function BooleanCell({ value }: { value: boolean | null | undefined }) {
  return <span>{value ? 'Sí' : 'No'}</span>;
}

export function getDocumentTypeColumns(onEdit?: (id: string) => void): ColumnDef<any>[] {
  return [
  {
    id: 'actions',
    meta: { excludeFromExport: true },
    cell: ({ row }) => <DocumentTypeRowActions row={row} onEdit={onEdit} />,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    meta: { title: 'Nombre' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    enableSorting: true,
  },
  {
    accessorKey: 'applies',
    meta: { title: 'Aplica a' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Aplica a" />,
    cell: ({ row }) => {
      const value = row.getValue('applies') as string;
      const variant = appliesVariantMap[value] ?? 'default';
      return <Badge variant={variant}>{value}</Badge>;
    },
    filterFn: (row, id, value) => {
      if (Array.isArray(value)) return value.includes(row.getValue(id));
      return true;
    },
  },
  {
    accessorKey: 'mandatory',
    meta: { title: 'Obligatorio' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Obligatorio" />,
    cell: ({ row }) => <BooleanCell value={row.original.mandatory} />,
  },
  {
    accessorKey: 'explired',
    meta: { title: 'Vencimiento' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimiento" />,
    cell: ({ row }) => <BooleanCell value={row.original.explired} />,
  },
  {
    accessorKey: 'is_it_montlhy',
    meta: { title: 'Mensual' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mensual" />,
    cell: ({ row }) => <BooleanCell value={row.original.is_it_montlhy} />,
  },
  {
    accessorKey: 'multiresource',
    meta: { title: 'Multi recurso' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Multi recurso" />,
    cell: ({ row }) => <BooleanCell value={row.original.multiresource} />,
  },
  {
    accessorKey: 'private',
    meta: { title: 'Privado' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Privado" />,
    cell: ({ row }) => <BooleanCell value={row.original.private} />,
  },
  {
    accessorKey: 'special',
    meta: { title: 'Condicional' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Condicional" />,
    cell: ({ row }) => <BooleanCell value={row.original.special} />,
  },
  {
    accessorKey: 'down_document',
    meta: { title: 'De baja' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="De baja" />,
    cell: ({ row }) => <BooleanCell value={row.original.down_document} />,
  },
  {
    accessorKey: 'is_active',
    meta: { title: 'Activo' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Activo" />,
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <Badge variant={isActive ? 'success' : 'destructive'}>
          {isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      if (Array.isArray(value)) return value.includes(row.getValue(id));
      return true;
    },
  },
  {
    accessorKey: 'description',
    meta: { title: 'Descripción' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.description || '-'}
      </span>
    ),
  },
  ];
}
