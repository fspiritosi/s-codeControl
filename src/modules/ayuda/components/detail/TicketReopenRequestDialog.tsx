'use client';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Textarea } from '@/shared/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { uploadSupportTicketAttachment } from '../../actions/support-attachments';
import { useRequestTicketReopen } from '../../hooks/useRequestTicketReopen';
import { TicketAttachmentInput } from '../TicketAttachmentInput';

const schema = z.object({
  reason: z
    .string()
    .trim()
    .min(20, 'Contanos un poco más, mínimo 20 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
  attachments: z.array(z.instanceof(File)).max(3),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  ticketId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketReopenRequestDialog({ ticketId, open, onOpenChange }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '', attachments: [] },
  });
  const [uploading, setUploading] = useState(false);
  const reopen = useRequestTicketReopen(ticketId);
  const isBusy = uploading || reopen.isPending;

  async function onSubmit(values: FormValues) {
    try {
      let keys: string[] = [];
      if (values.attachments && values.attachments.length > 0) {
        setUploading(true);
        const results = await Promise.all(
          values.attachments.map(async (file) => {
            const fd = new FormData();
            fd.append('file', file);
            return uploadSupportTicketAttachment(fd);
          })
        );
        keys = results.map((r) => r.key);
        setUploading(false);
      }
      await reopen.mutateAsync({ reason: values.reason, attachmentKeys: keys });
      toast.success('Solicitud enviada. Te avisamos cuando haya respuesta.');
      form.reset({ reason: '', attachments: [] });
      onOpenChange(false);
    } catch (e) {
      setUploading(false);
      toast.error(e instanceof Error ? e.message : 'Error al enviar la solicitud');
    }
  }

  const reasonValue = form.watch('reason') ?? '';

  return (
    <Dialog open={open} onOpenChange={(o) => !isBusy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-emerald-600" />
            Solicitar reapertura del ticket
          </DialogTitle>
          <DialogDescription>
            Explicale al equipo por qué necesitás retomar este ticket. Si tenés capturas o
            archivos que ayuden, sumalos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificación</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Ej: el error volvió a aparecer al hacer X después de Y. Ya probé con Z y no se resuelve…"
                      disabled={isBusy}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <FormMessage />
                    <span>{reasonValue.length}/2000</span>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Adjuntos (opcional)</FormLabel>
                  <FormControl>
                    <TicketAttachmentInput
                      files={field.value ?? []}
                      onChange={field.onChange}
                      disabled={isBusy}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isBusy}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar solicitud
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
