'use client';
import { Button } from '@/components/ui/button';
import { BaseDataTable } from '@/shared/components/data-table/base/data-table';
import { DataTableColumnHeader } from '@/shared/components/data-table/base/data-table-column-header';
import { createFilterOptions } from '@/shared/components/utils/utils';
import { ColumnDef } from '@tanstack/react-table';
import Cookies from 'js-cookie';
import { fetchAllHseDocTypes } from '../actions/documents';



export interface DocTypeTableProp {
  mode: 'create' | 'edit';
  setMode: (mode: 'create' | 'edit') => void;
  selectedHse_Doc_type: Awaited<ReturnType<typeof fetchAllHseDocTypes>>[number] | null;
  setSelectedHse_Doc_type: (hse_doc_type: Awaited<ReturnType<typeof fetchAllHseDocTypes>>[number] | null) => void;
  hse_doc_types: Awaited<ReturnType<typeof fetchAllHseDocTypes>>;
}

export function getTagColums(handleEdit: (hse_doc_types:  DocTypeTableProp['hse_doc_types'][number]) => void): ColumnDef<DocTypeTableProp['hse_doc_types'][number]>[] {
  return [
    {
      accessorKey: 'name',
      id: 'Nombre',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'short_description',
      id: 'Descripción corta',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción corta" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'is_active',
      id: 'Activo',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Activo" />,
      cell: ({ row }) => <>{row.original.is_active ? 'Sí' : 'No'}</>,
      filterFn: (row, id, value) => {
        const isActive = row.getValue(id) === true;
        return value.includes(isActive ? 'Sí' : 'No');
      },
    },
    {
      accessorKey: 'actions',
      id: 'Acciones',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Acciones" />,
      cell: ({ row }) => {
        const handleSelectArea = () => {
          handleEdit(row.original);
        };
        return (
          <Button size="sm" variant="link" className="hover:text-blue-400" onClick={handleSelectArea}>
            Editar
          </Button>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
  ];
}


function DocTypeTable({ hse_doc_types, selectedHse_Doc_type, setSelectedHse_Doc_type, setMode }: DocTypeTableProp) {
  const cookies = Cookies.get('areaTable');
  const handleEdit = (HseDocType: DocTypeTableProp['hse_doc_types'][number]) => {
    setSelectedHse_Doc_type(HseDocType);
    setMode('edit');
  };
 
  const savedVisibility = cookies ? JSON.parse(cookies) : {};


    const names = createFilterOptions(hse_doc_types, (tag) => tag.name);
  const short_descriptions = createFilterOptions(hse_doc_types, (tag) => tag.short_description || '');
  const isActive = createFilterOptions(hse_doc_types, (tag) => (tag.is_active ? 'Sí' : 'No'));

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <h2 className="text-xl font-bold ">Tipos de Documentos</h2>
      
      <BaseDataTable
        columns={getTagColums(handleEdit)}
        data={hse_doc_types || []}
        savedVisibility={savedVisibility}
        tableId="tagTable"
        toolbarOptions={{
          initialVisibleFilters: ['Nombre', 'Descripción corta', 'Activo'],
          filterableColumns: [
            {
              columnId: 'Nombre',
              title: 'Nombre',
              options: names,
            },
            {
              columnId: 'short_description',
              title: 'Descripción corta',
              options: short_descriptions,
            },
            {
              columnId: 'Activo',
              title: 'Activo',
              options: isActive,
            },
          ],
        }}
      />

    </div>
  );
}
  

export default DocTypeTable;
