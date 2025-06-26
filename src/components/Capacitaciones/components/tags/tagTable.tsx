'use client';
import { Button } from '@/components/ui/button';
import { BaseDataTable } from '@/shared/components/data-table/base/data-table';
import { DataTableColumnHeader } from '@/shared/components/data-table/base/data-table-column-header';
import { createFilterOptions } from '@/shared/components/utils/utils';
import { ColumnDef } from '@tanstack/react-table';
import Cookies from 'js-cookie';
import { fetchAllTags } from '../../actions/actions';
type Area = Awaited<ReturnType<typeof fetchAllTags>>[0];
export interface AreaTableProp {
  mode: 'create' | 'edit';
  setMode: (mode: 'create' | 'edit') => void;
  selectedTag: Area | null;
  setSelectedTag: (tag: Area | null) => void;
  tags: Area[];
}

export function getTagColums(handleEdit: (tag: Area) => void): ColumnDef<Area>[] {
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
      accessorKey: 'color',
      id: 'Color',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Color" />,
      cell: ({ row }) => {
        return <div className="size-7 rounded-full" style={{ backgroundColor: row.original.color || '#CCCCCC' }} />;
      },
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

interface TagTableProp {
  tags: Area[];
  selectedTag: Area | null;
  setSelectedTag: (tag: Area | null) => void;
  setMode: (mode: 'create' | 'edit') => void;
}
function TagTable({ tags, selectedTag, setSelectedTag, setMode }: TagTableProp) {
  const cookies = Cookies.get('areaTable');
  const handleEdit = (tag: TagTableProp['tags'][number]) => {
    setSelectedTag(tag);
    setMode('edit');
  };

  const savedVisibility = cookies ? JSON.parse(cookies) : {};

  const names = createFilterOptions(tags, (tag) => tag.name);
  const colors = createFilterOptions(tags, (tag) => tag.color || '');
  const isActive = createFilterOptions(tags, (tag) => (tag.is_active ? 'Sí' : 'No'));

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <h2 className="text-xl font-bold ">Etiquetas</h2>

      <BaseDataTable
        columns={getTagColums(handleEdit)}
        data={tags}
        savedVisibility={savedVisibility}
        tableId="tagTable"
        toolbarOptions={{
          initialVisibleFilters: ['Nombre', 'Color', 'Activo'],
          filterableColumns: [
            {
              columnId: 'Nombre',
              title: 'Nombre',
              options: names,
            },
            {
              columnId: 'Color',
              title: 'Color',
              options: colors,
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

export default TagTable;
