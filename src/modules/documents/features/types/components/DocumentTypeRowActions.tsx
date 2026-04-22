'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

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
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

import {
  updateDocumentTypeActive,
  deleteDocumentType,
} from '../actions.server';

interface DocumentTypeRowActionsProps {
  row: any;
  onEdit?: (id: string) => void;
}

export function DocumentTypeRowActions({ row, onEdit }: DocumentTypeRowActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const docType = row.original;
  const isActive = docType.is_active;

  async function handleToggleActive() {
    setIsLoading(true);
    try {
      const result = await updateDocumentTypeActive(docType.id, !isActive);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isActive ? 'Tipo de documento desactivado' : 'Tipo de documento activado');
        router.refresh();
      }
    } catch {
      toast.error('Error al cambiar el estado');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsLoading(true);
    try {
      const result = await deleteDocumentType(docType.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Tipo de documento eliminado');
        router.refresh();
      }
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar tipo de documento</AlertDialogTitle>
            <AlertDialogDescription>
              {`¿Estás seguro de que deseas eliminar "${docType.name}"? Esta acción no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
            <span className="sr-only">Abrir menú</span>
            <DotsVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit?.(docType.id)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleToggleActive}>
            {isActive ? 'Desactivar' : 'Activar'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
