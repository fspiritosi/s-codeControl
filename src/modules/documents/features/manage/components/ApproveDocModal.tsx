'use client';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateDocumentEmployeeState, updateDocumentEquipmentState } from '@/modules/documents/features/manage/actions.server';

export default function ApproveDocModal({ id, resource }: { id: string; resource: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const handleApprove = async () => {
    if (resource === 'employee') {
      const { error } = await updateDocumentEmployeeState(id, 'aprobado');

      if (error) {
        return toast.error('Ocurrio un error al aprobar el documento');
      }

      toast.success('El documento ha sido aprobado correctamente');
    } else {
      const { error } = await updateDocumentEquipmentState(id, 'aprobado');

      if (error) {
        return toast.error('Ocurrio un error al aprobar el documento');
      }

      toast.success('El documento ha sido aprobado correctamente');
    }

    router.push('/admin/auditor');
  };
  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <DialogTrigger asChild>
        <Button variant="success">Aprobar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle>Aprobar documento</DialogTitle>
          <DialogDescription>
            Estas seguro que deseas aprobar este documento? esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => handleApprove()} type="submit" variant="success">
            Aprobar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
