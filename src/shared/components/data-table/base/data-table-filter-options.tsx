'use client';

import { Button } from '@/components/ui/button';
import { CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import cookiejs from 'js-cookie';
import { Filter, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Definir la interfaz para las propiedades del componente
interface DataTableFilterOptionsProps {
  filterableColumns: any[]; // Los filtros disponibles
  visibleFilters: string[]; // IDs de filtros actualmente visibles
  onVisibilityChange: (visibleFilters: string[]) => void; // Callback cuando cambia la visibilidad
  tableId?: string; // ID opcional para guardar estado en cookies
  columnVisibility: Record<string, boolean>; // Estado de visibilidad de columnas
}

export function DataTableFilterOptions({
  filterableColumns,
  visibleFilters,
  onVisibilityChange,
  tableId,
  columnVisibility,
}: DataTableFilterOptionsProps) {
  // Estados para controlar el menú personalizado
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Función para guardar el estado de visibilidad en cookies
  const saveVisibilityState = (newVisibility: string[]) => {
    if (!tableId) return;

    // Guardar en cookies
    cookiejs.set(`${tableId}-filters`, JSON.stringify(newVisibility), {
      expires: 365, // Válido por un año
      path: '/', // Disponible en toda la aplicación
      sameSite: 'strict',
    });
  };

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

  // Manejar cambio de estado del checkbox
  const handleCheckboxChange = (columnId: string, checked: boolean) => {
    let newVisibleFilters: string[];

    if (checked) {
      // Añadir a los filtros visibles si no está
      newVisibleFilters = [...visibleFilters, columnId];
    } else {
      // Quitar de los filtros visibles
      newVisibleFilters = visibleFilters.filter((id) => id !== columnId);
    }

    // Actualizar estado local y guardar en cookies
    onVisibilityChange(newVisibleFilters);
    saveVisibilityState(newVisibleFilters);
  };

  console.log('visibleFilters', visibleFilters);
  console.log('filterableColumns', filterableColumns);

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón para abrir/cerrar el menú */}
      <Button variant="outline" size="sm" className="ml-2 hidden h-8 lg:flex" onClick={() => setIsOpen(!isOpen)}>
        <Filter className="mr-2 h-4 w-4" />
        Filtros
      </Button>

      {/* Menú personalizado */}
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 min-w-[200px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950 p-1 shadow-md">
          <div className="flex items-center justify-between p-2 font-medium">
            <CardDescription>Mostrar filtros</CardDescription>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="my-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-1 max-h-[300px] overflow-y-auto">
            {filterableColumns
              // Filtrar para mostrar solo opciones de columnas visibles
              .filter((column) => columnVisibility[column.columnId] !== false)
              .map((column) => (
                <div
                  key={column.columnId}
                  className="flex items-center space-x-2 p-1 dark:hover:bg-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <Checkbox
                    id={`filter-${column.columnId}`}
                    checked={visibleFilters?.includes(column.columnId)}
                    onCheckedChange={(checked) => {
                      handleCheckboxChange(column.columnId, !!checked);
                    }}
                  />
                  <label htmlFor={`filter-${column.columnId}`} className="flex-grow text-sm capitalize cursor-pointer">
                    {column.title || column.columnId}
                  </label>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
