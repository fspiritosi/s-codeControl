'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FileText, Image as ImageIcon, ExternalLink, Trash2, Replace } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import {
  PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME,
  PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES,
} from '@/modules/purchasing/shared/validators';
import {
  preparePurchaseInvoiceAttachmentUpload,
  confirmPurchaseInvoiceAttachmentUpload,
  getPurchaseInvoiceAttachmentSignedUrl,
  removePurchaseInvoiceDocument,
} from '@/modules/purchasing/features/invoices/list/actions.server';
import { storage } from '@/shared/lib/storage';

interface Props {
  invoiceId: string;
  documentKey: string | null;
}

function detectKind(key: string | null): 'image' | 'pdf' | null {
  if (!key) return null;
  const lower = key.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) return 'image';
  return null;
}

export default function InvoiceAttachmentSection({ invoiceId, documentKey }: Props) {
  const router = useRouter();
  const kind = detectKind(documentKey);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSignedUrl(null);
    if (!documentKey) return;
    setLoadingUrl(true);
    getPurchaseInvoiceAttachmentSignedUrl(invoiceId, 600)
      .then((res) => {
        if (res.url) setSignedUrl(res.url);
      })
      .finally(() => setLoadingUrl(false));
  }, [invoiceId, documentKey]);

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!(PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME as readonly string[]).includes(file.type)) {
      toast.error('Tipo no permitido. Solo JPG, PNG o PDF.');
      e.target.value = '';
      return;
    }
    if (file.size > PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES) {
      toast.error('El archivo supera los 10 MB.');
      e.target.value = '';
      return;
    }
    setBusy(true);
    try {
      const prep = await preparePurchaseInvoiceAttachmentUpload({
        invoiceId,
        fileName: file.name,
        mime: file.type,
        size: file.size,
      });
      if (!prep.ok) {
        toast.error(prep.error);
        return;
      }

      try {
        await storage.upload(prep.bucket, prep.path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
      } catch (uploadErr: any) {
        toast.error(uploadErr?.message || 'Error al subir el archivo');
        return;
      }

      const confirmRes = await confirmPurchaseInvoiceAttachmentUpload({
        invoiceId,
        path: prep.path,
      });
      if (confirmRes.error) {
        try {
          await storage.remove(prep.bucket, [prep.path]);
        } catch {}
        toast.error(confirmRes.error);
        return;
      }

      toast.success(documentKey ? 'Adjunto reemplazado' : 'Adjunto cargado');
      router.refresh();
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const handleRemove = async () => {
    if (!confirm('¿Quitar el adjunto de esta factura?')) return;
    setBusy(true);
    const res = await removePurchaseInvoiceDocument(invoiceId);
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Adjunto eliminado');
      router.refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {kind === 'image' ? <ImageIcon className="size-4" /> : <FileText className="size-4" />}
          Adjunto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documentKey ? (
          <>
            {kind === 'image' && signedUrl && (
              <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signedUrl}
                  alt="Adjunto factura"
                  className="max-h-64 rounded-md border object-contain bg-muted"
                />
              </a>
            )}
            {kind === 'pdf' && signedUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4 mr-2" /> Ver PDF
                </a>
              </Button>
            )}
            {loadingUrl && <p className="text-xs text-muted-foreground">Cargando vista previa...</p>}

            <div className="flex flex-wrap gap-2 pt-2">
              <label>
                <input
                  type="file"
                  className="hidden"
                  accept={PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME.join(',')}
                  onChange={handleReplace}
                  disabled={busy}
                />
                <Button type="button" variant="outline" size="sm" asChild disabled={busy}>
                  <span>
                    <Replace className="size-4 mr-2" /> Reemplazar
                  </span>
                </Button>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={busy}
              >
                <Trash2 className="size-4 mr-2 text-destructive" /> Quitar
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Esta factura no tiene adjunto.</p>
            <p className="text-xs text-muted-foreground">JPG, PNG o PDF. Máx. 10 MB.</p>
            <Input
              type="file"
              accept={PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME.join(',')}
              onChange={handleReplace}
              disabled={busy}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
