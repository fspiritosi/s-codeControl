'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FileText, Image as ImageIcon, ExternalLink, Trash2, Upload } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME,
  PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES,
} from '@/modules/purchasing/shared/validators';
import { storage } from '@/shared/lib/storage';
import { formatDateUTC } from '@/shared/lib/utils/formatters';
import {
  preparePurchaseOrderAttachmentUpload,
  confirmPurchaseOrderAttachmentUpload,
  deletePurchaseOrderAttachment,
  getPurchaseOrderAttachmentSignedUrl,
} from '../actions.server';

type Attachment = {
  id: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string | Date;
};

interface Props {
  orderId: string;
  attachments: Attachment[];
  canUpdate: boolean;
}

function iconFor(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return <FileText className="size-4 shrink-0" />;
  return <ImageIcon className="size-4 shrink-0" />;
}

export default function PurchaseOrderAttachmentsSection({ orderId, attachments, canUpdate }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    try {
      for (const file of files) {
        if (!(PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME as readonly string[]).includes(file.type)) {
          toast.error(`${file.name}: tipo no permitido (solo JPG, PNG o PDF).`);
          continue;
        }
        if (file.size > PURCHASE_INVOICE_ATTACHMENT_MAX_BYTES) {
          toast.error(`${file.name}: supera los 10 MB.`);
          continue;
        }
        const prep = await preparePurchaseOrderAttachmentUpload({
          orderId,
          fileName: file.name,
          mime: file.type,
          size: file.size,
        });
        if (!prep.ok) {
          toast.error(`${file.name}: ${prep.error}`);
          continue;
        }
        try {
          await storage.upload(prep.bucket, prep.path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });
        } catch (uploadErr: any) {
          toast.error(`${file.name}: ${uploadErr?.message || 'error al subir'}`);
          continue;
        }
        const confirmRes = await confirmPurchaseOrderAttachmentUpload({
          orderId,
          path: prep.path,
          fileName: file.name,
          size: file.size,
          mime: file.type,
        });
        if (confirmRes.error) {
          try {
            await storage.remove(prep.bucket, [prep.path]);
          } catch {}
          toast.error(`${file.name}: ${confirmRes.error}`);
        }
      }
      toast.success('Adjuntos actualizados');
      router.refresh();
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const handleOpen = async (attachmentId: string) => {
    setOpening(attachmentId);
    try {
      const res = await getPurchaseOrderAttachmentSignedUrl(attachmentId, 600);
      if (res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(res.error || 'No se pudo abrir el adjunto');
      }
    } finally {
      setOpening(null);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('¿Eliminar este adjunto?')) return;
    setBusy(true);
    const res = await deletePurchaseOrderAttachment(attachmentId);
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documentos adjuntos</CardTitle>
        {canUpdate && (
          <label>
            <input
              type="file"
              multiple
              className="hidden"
              accept={PURCHASE_INVOICE_ATTACHMENT_ALLOWED_MIME.join(',')}
              onChange={handleUpload}
              disabled={busy}
            />
            <Button type="button" variant="outline" size="sm" asChild disabled={busy}>
              <span>
                <Upload className="size-4 mr-1" /> {busy ? 'Subiendo…' : 'Subir'}
              </span>
            </Button>
          </label>
        )}
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div>
            <p className="text-sm text-muted-foreground">No hay documentos adjuntos.</p>
            <p className="text-xs text-muted-foreground">JPG, PNG o PDF. Máx. 10 MB cada uno.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {attachments.map((att) => (
              <li key={att.id} className="flex items-center gap-3 py-2">
                {iconFor(att.file_name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{att.file_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDateUTC(att.created_at)}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpen(att.id)}
                  disabled={opening === att.id}
                >
                  <ExternalLink className="size-4 mr-1" /> Ver
                </Button>
                {canUpdate && (
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(att.id)} disabled={busy} title="Eliminar">
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
