'use client';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { FormField } from '@/types/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import FieldRenderer from '../formUtils/fieldRenderer';
import { buildFormData, buildFormSchema } from '../formUtils/formUtils';

interface Props {
  campos: any[] | null;
  fetchAnswers?: () => Promise<void>;
}

export function SubmitCustomForm({ campos, fetchAnswers }: Props) {
  const formObject = buildFormData(campos, false);
  const FormSchema = buildFormSchema(formObject);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const router = useRouter();

  async function handleCustomFormSubmit(data: z.infer<typeof FormSchema>) {
    toast.promise(
      async () => {
        const supabase = supabaseBrowser();
        const { error } = await supabase.from('form_answers').insert({
          form_id: campos?.[0]?.id,
          answer: JSON.stringify(data),
        });
        if (error) {
          throw new Error(error.message);
        }
        if (fetchAnswers) await fetchAnswers();
      },
      {
        loading: 'Guardando...',
        success: () => {
          document.getElementById('close-drawer')?.click();
          return 'Respuesta guardada exitosamente';
        },
        error: (error) => {
          return error;
        },
      }
    );
  }

  return (
    <div className=" w-full rounded-e-xl rounded">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCustomFormSubmit)}>
          <div className="w-full space-y-6 grid grid-cols-3 gap-x-10">
            {formObject?.map((campo: FormField, index: number) => (
              <FieldRenderer
                key={crypto.randomUUID()}
                campo={campo}
                form={form}
                index={index}
                completObjet={formObject}
              />
            ))}
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  );
}
