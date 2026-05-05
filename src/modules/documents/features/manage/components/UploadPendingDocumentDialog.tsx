'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
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
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { preparePendingDocumentUpload, confirmPendingDocumentUpload } from '../actions.server';
import { storage } from '@/shared/lib/storage';

interface Props {
  rowId: string;
  kind: 'employee' | 'equipment';
  documentName: string;
  resourceLabel: string;
  expires: boolean;
  monthly: boolean;
}

export function UploadPendingDocumentDialog({
  rowId,
  kind,
  documentName,
  resourceLabel,
  expires,
  monthly,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [validity, setValidity] = useState('');
  const [period, setPeriod] = useState('');

  const handleSubmit = () => {
    if (!file) {
      toast.error('Seleccioná un archivo');
      return;
    }
    if (expires && !validity) {
      toast.error('Indicá la fecha de vencimiento');
      return;
    }
    if (monthly && !period) {
      toast.error('Indicá el período');
      return;
    }

    startTransition(async () => {
      const validityISO = validity ? new Date(validity).toISOString() : null;
      const periodValue = period || null;

      const prep = await preparePendingDocumentUpload({
        rowId,
        kind,
        fileName: file.name,
        validityISO,
        period: periodValue,
      });
      if (!prep.ok) {
        toast.error(prep.error || 'Error al preparar la carga');
        return;
      }

      try {
        await storage.upload(prep.bucket, prep.path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });
      } catch (e: any) {
        toast.error(e?.message || 'Error al subir el archivo');
        return;
      }

      const confirmRes = await confirmPendingDocumentUpload({
        rowId,
        kind,
        path: prep.path,
        validityISO,
        period: periodValue,
      });
      if (!confirmRes.ok) {
        try {
          await storage.remove(prep.bucket, [prep.path]);
        } catch {}
        toast.error(confirmRes.error || 'Error al confirmar la carga');
        return;
      }

      toast.success('Documento cargado correctamente');
      setOpen(false);
      setFile(null);
      setValidity('');
      setPeriod('');
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="size-4 mr-1.5" />
          Subir documento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Subir {documentName}</DialogTitle>
          <DialogDescription>
            {resourceLabel ? `${resourceLabel} — ` : ''}selecciona el archivo a cargar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="upload-pending-file">Archivo</Label>
            <Input
              id="upload-pending-file"
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={isPending}
            />
          </div>

          {expires && (
            <div className="space-y-2">
              <Label htmlFor="upload-pending-validity">Fecha de vencimiento</Label>
              <Input
                id="upload-pending-validity"
                type="date"
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                disabled={isPending}
              />
            </div>
          )}

          {monthly && (
            <div className="space-y-2">
              <Label htmlFor="upload-pending-period">Período</Label>
              <Input
                id="upload-pending-period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                disabled={isPending}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !file}>
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-1.5 animate-spin" />
                Subiendo...
              </>
            ) : (
              'Subir'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
