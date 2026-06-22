'use client';

import { Button } from '@/shared/components/ui/button';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlignLeft,
  Flame,
  Loader2,
  MessageSquarePlus,
  Paperclip,
  Send,
  Tag,
  Type,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { CATEGORIES, CATEGORY_SLUGS, type CategorySlug } from '../constants/categories';
import { useCreateTicket } from '../hooks/useCreateTicket';
import { useUploadAttachment } from '../hooks/useUploadAttachment';
import { TicketAttachmentInput } from './TicketAttachmentInput';
import { TicketPrioritySelect } from './TicketPrioritySelect';

const formSchema = z.object({
  // Derivado de CATEGORIES para que el form siga al sidebar sin desincronizarse.
  category: z.enum(CATEGORY_SLUGS),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().trim().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  description: z
    .string()
    .trim()
    .min(10, 'Contanos un poco más (mínimo 10 caracteres)')
    .max(5000, 'Máximo 5000 caracteres'),
});

type FormValues = z.infer<typeof formSchema>;

const LABEL_CLASS = 'flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground';

export function TicketForm() {
  const createTicket = useCreateTicket();
  const uploadAttachment = useUploadAttachment();
  const [files, setFiles] = useState<File[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: 'otro' as CategorySlug,
      priority: 'medium',
      title: '',
      description: '',
    },
  });

  const description = form.watch('description') ?? '';
  const descriptionLen = description.length;

  async function onSubmit(values: FormValues) {
    try {
      const attachmentKeys: string[] = [];
      for (const file of files) {
        // El ticket todavia no existe aca, asi que no pasamos ticketId.
        // El archivo queda en <project_slug>/<uuid>.<ext> y se asocia al
        // ticket recien al hacer createTicket.
        const { key } = await uploadAttachment.mutateAsync({ file });
        attachmentKeys.push(key);
      }

      await createTicket.mutateAsync({
        category: values.category,
        title: values.title,
        description: values.description,
        priority: values.priority,
        attachmentKeys,
      });

      toast.success('Tu reporte fue enviado. Te avisaremos cuando haya novedades.');
      form.reset({ category: values.category, priority: 'medium', title: '', description: '' });
      setFiles([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos enviar tu reporte');
    }
  }

  const isSubmitting = form.formState.isSubmitting || createTicket.isPending || uploadAttachment.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:18px_18px]"
        />

        <CardHeader className="border-b relative">
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <MessageSquarePlus className="h-4 w-4" />
            </span>
            Reportar un problema
          </CardTitle>
          <CardDescription>Contanos qué pasó y vamos a ocuparnos.</CardDescription>
        </CardHeader>

        <CardContent className="relative grid gap-5 pt-6">
          {/* Clasificación */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>
                    <Tag className="h-3.5 w-3.5" />
                    Categoría
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Elegí una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => {
                        const Icon = c.icon;
                        return (
                          <SelectItem key={c.slug} value={c.slug}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {c.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>
                    <Flame className="h-3.5 w-3.5" />
                    Prioridad
                  </FormLabel>
                  <FormControl>
                    <TicketPrioritySelect
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Asunto */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>
                  <Type className="h-3.5 w-3.5" />
                  Asunto
                </FormLabel>
                <FormControl>
                  <Input placeholder="Resumí en una línea qué te pasa" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción + char counter */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className={LABEL_CLASS}>
                    <AlignLeft className="h-3.5 w-3.5" />
                    Descripción
                  </FormLabel>
                  <span
                    className={`text-[11px] tabular-nums ${
                      descriptionLen > 4500 ? 'text-amber-600' : 'text-muted-foreground'
                    }`}
                  >
                    {descriptionLen}/5000
                  </span>
                </div>
                <FormControl>
                  <Textarea
                    rows={6}
                    placeholder="Pasos para reproducir, qué esperabas vs qué pasó…"
                    className="resize-y min-h-[140px]"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Adjuntos en su propio "panel" sutilmente diferenciado */}
          <div className="rounded-lg border border-dashed bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className={LABEL_CLASS}>
                <Paperclip className="h-3.5 w-3.5" />
                Adjuntos
              </span>
              <span className="text-[11px] text-muted-foreground">opcional</span>
            </div>
            <TicketAttachmentInput files={files} onChange={setFiles} disabled={isSubmitting} />
          </div>
        </CardContent>

        <CardFooter className="border-t mt-2 pt-4 justify-end relative">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSubmitting ? 'Enviando…' : 'Enviar reporte'}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}
