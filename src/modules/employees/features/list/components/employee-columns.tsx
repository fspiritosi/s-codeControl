'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/shared/components/common/DataTable';
import { Badge } from '@/shared/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { EmployeeRowActions } from './EmployeeRowActions';

/** Normaliza valores de enum Prisma: reemplaza _ por espacio */
const fmt = (v: string) => v.replaceAll('_', ' ');

const statusVariantMap: Record<string, 'success' | 'yellow' | 'destructive'> = {
  Avalado: 'success',
  Completo: 'success',
  Incompleto: 'yellow',
  'No avalado': 'destructive',
  'Completo con doc vencida': 'yellow',
};

export const employeeColumns: ColumnDef<any>[] = [
  {
    id: 'actions',
    meta: { excludeFromExport: true },
    cell: ({ row }) => <EmployeeRowActions row={row} />,
    enableHiding: false,
  },
  {
    id: 'full_name',
    accessorFn: (row: any) => `${row.lastname ?? ''} ${row.firstname ?? ''}`.trim(),
    meta: { title: 'Nombre completo' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre completo" />,
    cell: ({ row }) => (
      <Link
        href={`/dashboard/employee/action?action=view&employee_id=${row.original.id}`}
        className="hover:underline font-medium"
      >
        {row.original.lastname} {row.original.firstname}
      </Link>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    meta: { title: 'Estado' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const raw = row.getValue('status') as string;
      const label = raw ? fmt(raw) : '';
      const variant = statusVariantMap[label] ?? 'destructive';
      return <Badge variant={variant}>{label}</Badge>;
    },
    filterFn: (row, id, value) => {
      if (Array.isArray(value)) return value.includes(row.getValue(id));
      if (!value) return true;
      return String(row.getValue(id)).toLowerCase() === String(value).toLowerCase();
    },
  },
  {
    accessorKey: 'picture',
    meta: { title: 'Foto', excludeFromExport: true },
    header: 'Foto',
    cell: ({ row }) => (
      <img
        src={row.getValue('picture') || '/placeholder.svg'}
        alt="Foto"
        className="size-10 rounded-full object-cover"
      />
    ),
  },
  {
    accessorKey: 'file',
    meta: { title: 'Legajo' },
    header: 'Legajo',
  },
  {
    accessorKey: 'lastname',
    meta: { title: 'Apellido' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Apellido" />,
    enableSorting: true,
  },
  {
    accessorKey: 'firstname',
    meta: { title: 'Nombre' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    enableSorting: true,
  },
  {
    accessorKey: 'born_date',
    meta: { title: 'Fecha de nacimiento' },
    header: 'Fecha de nacimiento',
    cell: ({ row }) => {
      const value = row.getValue('born_date') as string;
      return value ? format(new Date(value), 'dd/MM/yyyy') : '';
    },
  },
  {
    accessorKey: 'email',
    meta: { title: 'Email' },
    header: 'Email',
  },
  {
    accessorKey: 'cuil',
    meta: { title: 'Cuil' },
    header: 'Cuil',
  },
  {
    accessorKey: 'document_type',
    meta: { title: 'Tipo de documento' },
    header: 'Tipo de documento',
  },
  {
    accessorKey: 'document_number',
    meta: { title: 'Numero de documento' },
    header: 'Numero de documento',
  },
  {
    accessorKey: 'nationality',
    meta: { title: 'Nacionalidad' },
    header: 'Nacionalidad',
  },
  {
    accessorKey: 'gender',
    meta: { title: 'Genero' },
    header: 'Genero',
  },
  {
    accessorKey: 'birthplace',
    meta: { title: 'Lugar de nacimiento' },
    header: 'Lugar de nacimiento',
  },
  {
    accessorKey: 'marital_status',
    meta: { title: 'Estado civil' },
    header: 'Estado civil',
  },
  {
    accessorKey: 'level_of_education',
    meta: { title: 'Nivel de estudios' },
    header: 'Nivel de estudios',
  },
  {
    accessorKey: 'date_of_admission',
    meta: { title: 'Fecha de ingreso' },
    header: 'Fecha de ingreso',
    cell: ({ row }) => {
      const value = row.getValue('date_of_admission') as string;
      return value ? format(new Date(value), 'dd/MM/yyyy') : '';
    },
  },
  {
    accessorKey: 'hierarchical_position',
    meta: { title: 'Posicion jerarquica' },
    header: 'Posicion jerarquica',
    cell: ({ row }) => row.original.hierarchy_rel?.name ?? row.getValue('hierarchical_position'),
  },
  {
    accessorKey: 'company_position',
    meta: { title: 'Posicion en la empresa' },
    header: 'Posicion en la empresa',
  },
  {
    accessorKey: 'normal_hours',
    meta: { title: 'Horas normales' },
    header: 'Horas normales',
  },
  {
    accessorKey: 'workflow_diagram',
    meta: { title: 'Diagrama de trabajo' },
    header: 'Diagrama de trabajo',
  },
  {
    accessorKey: 'type_of_contract',
    meta: { title: 'Tipo de contrato' },
    header: 'Tipo de contrato',
    cell: ({ row }) => {
      const value = row.getValue('type_of_contract') as string;
      return value ? fmt(value) : '';
    },
  },
  {
    accessorKey: 'allocated_to',
    meta: { title: 'Afectado a' },
    header: 'Afectado a',
    cell: ({ row }) => {
      const contractors = row.original.contractor_employee;
      if (!contractors || !Array.isArray(contractors) || contractors.length === 0) {
        return <Badge variant="outline">Sin afectar</Badge>;
      }
      const names = contractors
        .map((ce: any) => ce.contractor?.name)
        .filter(Boolean)
        .join(', ');
      return <span>{names || <Badge variant="outline">Sin afectar</Badge>}</span>;
    },
  },
  {
    accessorKey: 'province',
    meta: { title: 'Provincia' },
    header: 'Provincia',
  },
  {
    accessorKey: 'city',
    meta: { title: 'Ciudad' },
    header: 'Ciudad',
  },
  {
    accessorKey: 'street',
    meta: { title: 'Calle' },
    header: 'Calle',
  },
  {
    accessorKey: 'street_number',
    meta: { title: 'Numero de calle' },
    header: 'Numero de calle',
  },
  {
    accessorKey: 'postal_code',
    meta: { title: 'Codigo postal' },
    header: 'Codigo postal',
  },
  {
    accessorKey: 'phone',
    meta: { title: 'Telefono' },
    header: 'Telefono',
  },
  {
    accessorKey: 'guild',
    meta: { title: 'Asociacion gremial' },
    header: 'Asociacion gremial',
    cell: ({ row }) => <span>{row.original.guild_rel?.name ?? ''}</span>,
  },
  {
    accessorKey: 'covenants',
    meta: { title: 'Convenio' },
    header: 'Convenio',
    cell: ({ row }) => <span>{row.original.covenants_rel?.name ?? ''}</span>,
  },
  {
    accessorKey: 'category',
    meta: { title: 'Categoria' },
    header: 'Categoria',
    cell: ({ row }) => <span>{row.original.category_rel?.name ?? ''}</span>,
  },
];
