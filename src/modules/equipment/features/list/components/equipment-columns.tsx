'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/shared/components/common/DataTable';
import { Badge } from '@/shared/components/ui/badge';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { RiToolsFill } from 'react-icons/ri';
import { EquipmentRowActions } from './EquipmentRowActions';

const statusVariantMap: Record<string, 'success' | 'yellow' | 'destructive'> = {
  Avalado: 'success',
  Completo: 'success',
  Incompleto: 'yellow',
  'No avalado': 'destructive',
  'Completo con doc vencida': 'yellow',
};

const conditionVariants: Record<string, string> = {
  operativo: 'success',
  'no operativo': 'destructive',
  'en reparacion': 'yellow',
  'operativo condicionado': 'info',
};

const conditionConfig: Record<string, { icon: React.ElementType }> = {
  operativo: { icon: CheckCircle },
  'no operativo': { icon: XCircle },
  'en reparacion': { icon: RiToolsFill },
  'operativo condicionado': { icon: AlertTriangle },
};

export const equipmentColumns: ColumnDef<any>[] = [
  {
    id: 'actions',
    meta: { excludeFromExport: true },
    cell: ({ row }) => <EquipmentRowActions row={row} />,
    enableHiding: false,
  },
  {
    accessorKey: 'intern_number',
    meta: { title: 'Nro. interno' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nro. interno" />,
    cell: ({ row }) => (
      <Link
        href={`/dashboard/equipment/action?action=view&id=${row.original.id}`}
        className="hover:underline font-medium"
      >
        {row.original.intern_number}
      </Link>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'domain',
    meta: { title: 'Dominio' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Dominio" />,
    enableSorting: true,
    filterFn: (row, columnId, filterValue) => {
      if (
        row.original.intern_number?.toLowerCase().includes(filterValue.toLowerCase()) ||
        row.original.domain?.toLowerCase()?.includes(filterValue.toLowerCase())
      ) {
        return true;
      }
      return false;
    },
  },
  {
    accessorKey: 'chassis',
    meta: { title: 'Chassis' },
    header: 'Chassis',
  },
  {
    accessorKey: 'status',
    meta: { title: 'Estado' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const status = row.original.status as string | undefined;
      return (
        <Badge variant={statusVariantMap[status ?? ''] ?? 'destructive'}>{status}</Badge>
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      if (Array.isArray(value)) return value.includes(row.getValue(id));
      if (!value) return true;
      return String(row.getValue(id)).toLowerCase() === String(value).toLowerCase();
    },
  },
  {
    accessorKey: 'type',
    meta: { title: 'Tipo' },
    header: 'Tipo',
    cell: ({ row }) => <Badge>{row.original.type_rel?.name}</Badge>,
    filterFn: (row, columnId, filterValue) => {
      return (
        row.original.type_rel?.name?.toLowerCase()?.includes(filterValue.toLowerCase()) ?? false
      );
    },
  },
  {
    accessorKey: 'types_of_vehicles',
    meta: { title: 'Tipo de vehiculo' },
    header: 'Tipo de vehiculo',
    cell: ({ row }) => <Badge>{row.original.type_of_vehicle_rel?.name as string}</Badge>,
  },
  {
    accessorKey: 'engine',
    meta: { title: 'Motor' },
    header: 'Motor',
  },
  {
    accessorKey: 'serie',
    meta: { title: 'Serie' },
    header: 'Serie',
  },
  {
    accessorKey: 'allocated_to',
    meta: { title: 'Afectado a' },
    header: 'Afectado a',
    cell: ({ row }) => {
      const contractors = row.original.contractor_equipment;
      if (!contractors || !Array.isArray(contractors) || contractors.length === 0) {
        return <Badge variant="outline">Sin afectar</Badge>;
      }
      return contractors.map((ce: any) => (
        <Badge key={ce.contractor?.id ?? ce.contractor_id?.id}>
          {ce.contractor?.name ?? ce.contractor_id?.name}
        </Badge>
      ));
    },
    filterFn: (row, columnId, filterValue) => {
      if (filterValue === 'sin afectar' && row.original.allocated_to === null) {
        return true;
      }
      if (
        row.original.contractor_equipment?.some((ce: any) => {
          const name = ce.contractor?.name ?? ce.contractor_id?.name;
          return name?.includes(filterValue);
        })
      ) {
        return true;
      }
      return false;
    },
  },
  {
    accessorKey: 'year',
    meta: { title: 'Ano' },
    header: 'Ano',
  },
  {
    accessorKey: 'condition',
    meta: { title: 'Condicion' },
    header: 'Condicion',
    cell: ({ row }) => {
      const condition = row.original?.condition as string | undefined;
      const variant = (conditionVariants[condition ?? ''] ?? 'default') as any;
      const config = condition ? conditionConfig[condition] : null;
      return (
        <Badge variant={variant}>
          {config?.icon && React.createElement(config.icon, { className: 'mr-2 size-4' })}
          {condition}
        </Badge>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      if (filterValue === 'Todos') return true;
      return row.original.condition === filterValue;
    },
  },
  {
    accessorKey: 'brand',
    meta: { title: 'Marca' },
    header: 'Marca',
    cell: ({ row }) => <div>{row.original.brand_rel?.name}</div>,
    filterFn: (row, columnId, filterValue) => {
      return (
        row.original?.brand_rel?.name?.toLowerCase()?.includes(filterValue.toLowerCase()) ?? false
      );
    },
  },
  {
    accessorKey: 'kilometer',
    meta: { title: 'Kilometros' },
    header: 'Kilometros',
    cell: ({ row }) => <Badge variant="outline">{row.original.kilometer} km</Badge>,
  },
  {
    accessorKey: 'model',
    meta: { title: 'Modelo' },
    header: 'Modelo',
    cell: ({ row }) => <div>{row.original.model_rel?.name}</div>,
    filterFn: (row, columnId, filterValue) => {
      return (
        row.original.model_rel?.name?.toLowerCase().includes(filterValue.toLowerCase()) ?? false
      );
    },
  },
  {
    accessorKey: 'picture',
    meta: { title: 'Foto', excludeFromExport: true },
    header: 'Foto',
    cell: ({ row }) => {
      const src = row.getValue('picture') as string;
      return src ? (
        <img src={src} alt="Foto" className="size-10 rounded-full object-cover" />
      ) : (
        <span className="text-muted-foreground text-sm">No disponible</span>
      );
    },
  },
];
