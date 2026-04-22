'use client';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/shared/components/ui/table';
import { storage } from '@/shared/lib/storage';
import { fetchDocumentEmployeesLogs } from '@/modules/documents/features/list/actions.server';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { formatRelative } from 'date-fns';
import { es } from 'date-fns/locale';
import { saveAs } from 'file-saver';
import { useState } from 'react';
import { toast } from 'sonner';

interface DocumentRowActionsProps {
  row: any;
}

export function DocumentRowActions({ row }: DocumentRowActionsProps) {
  const [viewModal, setViewModal] = useState(false);
  const [documentHistory, setDocumentHistory] = useState<any[]>([]);

  const document = row.original;

  const handleDownload = async (path: string, fileName: string, resourceName: string) => {
    toast.promise(
      async () => {
        const data = await storage.download('document_files', path);
        const extension = path.split('.').pop();
        const blob = new Blob([data], { type: 'application/octet-stream' });
        saveAs(blob, `${resourceName} ${fileName}.${extension}`);
      },
      {
        loading: 'Descargando documento...',
        success: 'Documento descargado',
        error: (error) => {
          return error;
        },
      }
    );
  };

  const handleOpenViewModal = async () => {
    setViewModal(true);
    try {
      const data = await fetchDocumentEmployeesLogs(document.id);
      if (data) {
        setDocumentHistory(data as any);
      }
    } catch {
      toast.error('Error al obtener historial');
    }
  };

  return (
    <DropdownMenu>
      {viewModal && (
        <Dialog defaultOpen onOpenChange={() => setViewModal(false)}>
          <DialogContent>
            <DialogTitle>Historial de Modificaciones</DialogTitle>
            <DialogDescription>
              Aqui se muestra quien modifico el documento y cuando
            </DialogDescription>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="text-center">Usuario</TableCell>
                  <TableCell className="text-center">Fecha de modificacion</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentHistory?.map((entry: any) => (
                  <TableRow key={crypto.randomUUID()}>
                    <TableCell className="text-center">
                      {entry.documents_employees.user_id.email}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatRelative(new Date(entry.updated_at), new Date(), { locale: es })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <DialogFooter>
              <Button onClick={() => setViewModal(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <DotsVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Opciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(document.document_number);
            toast.success('DNI copiado al portapapeles');
          }}
        >
          Copiar DNI
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenViewModal}>Ver historial</DropdownMenuItem>
        <DropdownMenuItem
          disabled={document.state === 'pendiente'}
          onClick={() =>
            handleDownload(document.document_url, document.documentName, document.resource)
          }
        >
          Descargar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
