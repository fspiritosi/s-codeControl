'use client';

import { Button } from '@/components/ui/button';
import { CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table } from '@tanstack/react-table';
import cookiejs from 'js-cookie';
import { SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
  tableId?: string; // ID opcional para guardar estado en localStorage
}

export function DataTableViewOptions<TData>({ table, tableId }: DataTableViewOptionsProps<TData>) {
  // Estados para controlar el menú personalizado
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Función para guardar el estado de visibilidad en cookies
  const saveVisibilityState = (columnId?: string, isVisible?: boolean) => {
    if (!tableId) return;

    // Obtener el estado actual de visibilidad de columnas de la tabla
    const currentVisibility = table.getState().columnVisibility;

    // Crear una copia del estado actual de visibilidad
    let columnVisibility = { ...currentVisibility };

    // Si se proporciona una columna específica, actualizar solo esa en la cookie
    if (columnId && isVisible !== undefined) {
      // Actualizar la visibilidad de la columna específica en la cookie
      columnVisibility = {
        ...columnVisibility,
        [columnId]: isVisible,
      };
    }

    // Guardar en cookies con el mismo formato que se recibe del servidor
    cookiejs.set(`${tableId}`, JSON.stringify(columnVisibility), {
      expires: 365, // Válido por un año
      path: '/', // Disponible en toda la aplicación
      sameSite: 'strict',
    });
  };

  // Verificar el estado actual de visibilidad al montar el componente
  // useEffect(() => {
  //   if (!tableId) return;

  //   try {
  //     // saveVisibilityState();

  //   } catch (error) {
  //     console.error('Error al verificar el estado de visibilidad de columnas:', error);
  //   }
  // }, [table, tableId]);

  // Manejar clics fuera del menú para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón para abrir/cerrar el menú */}
      <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex" onClick={() => setIsOpen(!isOpen)}>
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Columnas
      </Button>

      {/* Menú personalizado */}
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 min-w-[200px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950 p-1 shadow-md">
          <div className="flex items-center justify-between p-2 font-medium">
            <CardDescription>Mostrar columnas</CardDescription>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="my-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-1 max-h-[300px] overflow-y-auto">
            {table
              .getAllColumns()
              .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
              .map((column) => (
                <div key={column.id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-md">
                  <Checkbox
                    id={`column-${column.id}`}
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked) => {
                      // Actualizar la visibilidad en la tabla (esto ya lo hace React Table)
                      column.toggleVisibility(!!checked);

                      // Guardar la visibilidad actualizada en cookies
                      if (tableId) {
                        // Pasar el ID de la columna y su nuevo estado a la función
                        saveVisibilityState(column.id, !!checked);
                      }
                    }}
                  />
                  <label htmlFor={`column-${column.id}`} className="flex-grow text-sm capitalize cursor-pointer">
                    {column.id}
                  </label>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
