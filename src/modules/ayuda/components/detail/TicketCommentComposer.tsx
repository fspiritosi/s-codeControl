'use client';

import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, Paperclip, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { appendSupportTicketAttachments } from '../../actions/support-attachments';
import { useCreateComment } from '../../hooks/useCreateComment';
import { useUploadAttachment } from '../../hooks/useUploadAttachment';
import { ticketDetailKey } from '../../hooks/useTicketDetail';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'];

interface Props {
  ticketId: number;
  currentUserEmail: string;
}

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
  isImage: boolean;
}

export function TicketCommentComposer({ ticketId, currentUserEmail }: Props) {
  const [body, setBody] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const commentMutation = useCreateComment(ticketId, currentUserEmail);
  const uploadMutation = useUploadAttachment();
  const isSending = commentMutation.isPending || uploadMutation.isPending;

  // Limpiar object URLs al desmontar para evitar memory leak
  useEffect(() => {
    return () => {
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trimmed = body.trim();
  const canSend = !isSending && (trimmed.length > 0 || pendingFiles.length > 0) && trimmed.length <= 5000;

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: PendingFile[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}": formato no soportado`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`"${file.name}": supera los 10 MB`);
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isImage: file.type.startsWith('image/'),
      });
    }
    if (next.length > 0) setPendingFiles((prev) => [...prev, ...next]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removePending(id: string) {
    setPendingFiles((prev) => {
      const toRemove = prev.find((f) => f.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  async function handleSend() {
    if (!canSend) return;

    const textToSend = trimmed;
    const filesToSend = pendingFiles;

    // Optimistic clear del composer
    setBody('');
    setPendingFiles([]);

    try {
      // 1. Subir archivos en paralelo
      let uploadedKeys: string[] = [];
      if (filesToSend.length > 0) {
        const results = await Promise.all(
          filesToSend.map((p) => uploadMutation.mutateAsync({ file: p.file, ticketId }))
        );
        uploadedKeys = results.map((r) => r.key);
        // 2. Asociar las keys al ticket
        await appendSupportTicketAttachments(ticketId, uploadedKeys);
        // 3. Invalidar el detalle del ticket para que la seccion "Adjuntos" refresque
        queryClient.invalidateQueries({ queryKey: ticketDetailKey(ticketId) });
      }

      // 4. Enviar comment con sufijo automatico si hubo adjuntos
      const suffix =
        filesToSend.length > 0
          ? `\n\n📎 ${filesToSend.length} archivo${filesToSend.length === 1 ? '' : 's'} adjunto${filesToSend.length === 1 ? '' : 's'}`
          : '';
      const finalBody = (textToSend + suffix).trim();
      if (finalBody.length > 0) {
        await commentMutation.mutateAsync(finalBody);
      }

      // Cleanup object URLs
      filesToSend.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    } catch (e) {
      // Restaurar estado si falla
      setBody(textToSend);
      setPendingFiles(filesToSend);
      toast.error(e instanceof Error ? e.message : 'Error al enviar');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="space-y-2 rounded-md border bg-background p-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribí una respuesta… (Ctrl+Enter para enviar)"
        rows={2}
        className="resize-none border-0 focus-visible:ring-0"
        disabled={isSending}
      />

      {pendingFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {pendingFiles.map((f) => (
            <div
              key={f.id}
              className="group relative overflow-hidden rounded-md border bg-muted/30"
              title={f.file.name}
            >
              {f.isImage ? (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img src={f.previewUrl} alt={f.file.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removePending(f.id)}
                disabled={isSending}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 disabled:opacity-30"
                aria-label={`Quitar ${f.file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="truncate px-1.5 py-1 text-[10px] text-muted-foreground">
                {f.file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isSending}
            className="text-muted-foreground"
            aria-label="Adjuntar archivo"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">{trimmed.length}/5000</span>
        </div>
        <Button type="button" size="sm" onClick={handleSend} disabled={!canSend}>
          {isSending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Enviar
        </Button>
      </div>
    </div>
  );
}
