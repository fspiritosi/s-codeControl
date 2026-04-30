'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Upload, Trash2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';

import {
  upsertPdfSettings,
  uploadSignatureImage,
  removeSignatureImage,
  SIGNABLE_PDF_KEYS,
  type PdfSettingsData,
} from '../actions.server';

interface Props {
  initial: PdfSettingsData;
}

export function PdfSettingsForm({ initial }: Props) {
  const router = useRouter();
  const [isSaving, startSave] = useTransition();
  const [isUploading, startUpload] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  const [headerText, setHeaderText] = useState(initial.header_text ?? '');
  const [footerText, setFooterText] = useState(initial.footer_text ?? '');
  const [signedKeys, setSignedKeys] = useState<string[]>(initial.signed_pdf_keys ?? []);

  const toggleKey = (key: string) =>
    setSignedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const handleSave = () => {
    startSave(async () => {
      const result = await upsertPdfSettings({
        header_text: headerText.trim() || null,
        footer_text: footerText.trim() || null,
        signed_pdf_keys: signedKeys,
      });
      if (result.error) {
        toast.error('Error al guardar', { description: result.error });
        return;
      }
      toast.success('Configuración guardada');
      router.refresh();
    });
  };

  const handleSignatureUpload = (file: File) => {
    if (!file.type.includes('png')) {
      toast.error('La firma debe ser un archivo PNG', {
        description: 'Recomendamos usar fondo transparente para mejor presentación.',
      });
      return;
    }
    startUpload(async () => {
      const fd = new FormData();
      fd.set('file', file);
      const result = await uploadSignatureImage(fd);
      if (result.error) {
        toast.error('Error al subir la firma', { description: result.error });
        return;
      }
      toast.success('Firma cargada');
      router.refresh();
    });
  };

  const handleRemoveSignature = () => {
    startRemove(async () => {
      const result = await removeSignatureImage();
      if (result.error) {
        toast.error('Error al eliminar', { description: result.error });
        return;
      }
      toast.success('Firma eliminada');
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Encabezado y pie de página</CardTitle>
          <CardDescription>
            Texto que aparecerá en cada página de los PDFs generados por el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdf-header">Texto del encabezado</Label>
            <Textarea
              id="pdf-header"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="Ej: Razón social — Dirección — Tel."
              rows={2}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdf-footer">Texto del pie de página</Label>
            <Textarea
              id="pdf-footer"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Ej: Generado por el sistema — Página X de Y"
              rows={2}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firma</CardTitle>
          <CardDescription>
            Imagen de la firma que se inserta al pie de los PDFs marcados. Recomendamos PNG con
            fondo transparente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {initial.signature_image_url ? (
            <div className="flex items-start gap-4">
              <div className="rounded-md border bg-muted/30 p-3">
                <img
                  src={initial.signature_image_url}
                  alt="Firma"
                  className="h-20 max-w-[240px] object-contain"
                />
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isRemoving}>
                    <Trash2 className="size-4 mr-2" />
                    Eliminar firma
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar la firma?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Los PDFs marcados dejarán de incluir la firma hasta que cargues una nueva.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveSignature} disabled={isRemoving}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay firma cargada.</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="pdf-signature">Subir firma (PNG)</Label>
            <Input
              id="pdf-signature"
              type="file"
              accept="image/png"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSignatureUpload(file);
                e.currentTarget.value = '';
              }}
            />
            {isUploading && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" /> Subiendo firma...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PDFs firmados</CardTitle>
          <CardDescription>
            Seleccioná qué PDFs deben incluir la firma cargada arriba.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {SIGNABLE_PDF_KEYS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-3 text-sm cursor-pointer">
                <Checkbox
                  checked={signedKeys.includes(opt.key)}
                  onCheckedChange={() => toggleKey(opt.key)}
                  disabled={isSaving}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </div>
  );
}
