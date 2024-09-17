'use client';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Campo } from '@/types/types';
import { ReaderIcon } from '@radix-ui/react-icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Dispatch, SetStateAction } from 'react';

export default function DisplayCreatedForms({
  createdForms,
  setSelectedForm,
}: {
  createdForms: any[] | undefined;
  setSelectedForm: Dispatch<SetStateAction<Campo[] | undefined>>;
}) {
  const handleSelectForm = (index: number) => {
    setSelectedForm(createdForms?.[index].form as Campo[]);
  };
  const handleEditForm = (form: any) => {
    document.getElementById('create_new_form')?.click();
  };
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const params = new URLSearchParams(searchParams);
  const { replace } = useRouter();

  const handleAnswersChange = (form_id: string) => {
    if (form_id) {
      params.set('form_id', form_id);
    } else {
      params.delete('form_id');
    }
    replace(`${pathname}?${params.toString()}`);
  };
  return (
    <section className="min-h-[60vh] p-4 pt-0 overflow-y-auto ">
      <div className="space-y-3">
        {createdForms?.map((form, index) => {
          return (
            <Card className="p-2 flex items-center justify-between" key={crypto.randomUUID()}>
              <div className="flex gap-4">
                <Button className="w-full hover:underline" onClick={() => handleAnswersChange(form.id)}>
                  <CardTitle className="capitalize flex items-center w-full">
                    <ReaderIcon className="size-6 mr-2" />
                    {form.name}
                  </CardTitle>
                </Button>
              </div>
              <div>
                <Button variant={'ghost'} onClick={() => handleEditForm(form)}>
                  Editar
                </Button>
                <Button variant={'ghost'} onClick={() => handleSelectForm(index)}>
                  Vista previa
                </Button>
              </div>
            </Card>
          );
        })}
        {createdForms?.length === 0 && (
          <Card className="p-2 flex items-center justify-between">
            <CardDescription className="capitalize flex items-center">No hay formularios creados</CardDescription>
          </Card>
        )}
      </div>
    </section>
  );
}
