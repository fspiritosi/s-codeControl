'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '../../supabase/supabase';
import { Textarea } from './ui/textarea';

type EmailInfo = {
  recurso: string;
  document_name: string;
  company_name: string;
  resource_name: string;
  document_number: string;
};

export default function DenyDocModal({
  id,
  resource,
  userEmail,
  emailInfo,
}: {
  id: string;
  resource: string | null;
  userEmail: string[];
  emailInfo: EmailInfo;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const FormSchema = z.object({
    reason: z
      .string({ required_error: 'El motivo es requerido' })
      .min(5, {
        message: 'El motivo debe tener al menos 5 caracteres.',
      })
      .max(160, {
        message: 'El motivo no puede tener más de 160 caracteres.',
      }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const router = useRouter();

  async function onSubmit(menssaje: z.infer<typeof FormSchema>) {
    if (resource === 'employee') {
      const { data, error } = await supabase
        .from('documents_employees')
        .update({ state: 'rechazado', deny_reason: menssaje.reason })
        .eq('id', id)
        .select();

      if (error) {
        setIsOpen(false);
        return toast.error('Ocurrio un error al rechazar el documento');
      }

      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          subject: 'Documento rechazado',
          react: menssaje.reason,
          userEmail: userEmail,
          body: emailInfo,
        }),
      });

      if (!response.ok) {
        throw new Error('Ocurrió un error al enviar el correo electrónico');
      }

      toast('Documento rechazado', { description: 'El documento ha sido rechazado correctamente' });
    } else {
      const { data, error } = await supabase
        .from('documents_equipment')
        .update({ state: 'rechazado', deny_reason: menssaje.reason, id })
        .eq('id', id)
        .select();

      if (error) {
        setIsOpen(false);
        return toast.error('Ocurrio un error al rechazar el documento');
      }
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          subject: 'Documento rechazado',
          react: menssaje.reason,
          userEmail: userEmail,
          body: emailInfo,
        }),
      });

      if (!response.ok) {
        throw new Error('Ocurrió un error al enviar el correo electrónico');
      }

      toast('Documento rechazado', { description: 'El documento ha sido rechazado correctamente' });
    }

    router.push('/admin/auditor');
    setIsOpen(false);
  }
  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <DialogTrigger asChild>
        <Button variant="destructive">Rechazar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle>Rechazar documento</DialogTitle>
        </DialogHeader>
        <div className="grid w-full gap-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=" space-y-6">
              <div className="flex flex-col">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cual es el motivo por el cual deseas rechazar este documento?"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Notificaremos al usuario el motivo por el cual rechazaste el documento.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="destructive" className="self-end mt-5">
                  Rechazar
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
