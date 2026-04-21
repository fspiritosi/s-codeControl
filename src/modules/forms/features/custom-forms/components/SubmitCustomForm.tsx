'use client';

import { Button } from '@/shared/components/ui/button';
import { Form } from '@/shared/components/ui/form';
import { insertFormAnswer } from '@/modules/forms/features/answers/actions.server';
import { FormField } from '@/shared/types/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import FieldRenderer from '@/modules/forms/features/custom-forms/components/formUtils/fieldRenderer';
import { buildFormData, buildFormSchema } from '@/modules/forms/features/custom-forms/components/formUtils/formUtils';

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
        const { error } = await insertFormAnswer(campos?.[0]?.id, JSON.stringify(data));
        if (error) {
          throw new Error(error);
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
