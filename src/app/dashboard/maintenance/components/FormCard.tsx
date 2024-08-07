import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerTrigger } from '@/components/ui/drawer';
import { FormData } from '@/types/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormUseChart } from './FormUseChart';
import { SubmitCustomForm } from './SubmitCustomForm';

function FormCard({
  form,
  chartConfig,
  chartData,
  showAnswers,
}: {
  form: FormData;
  chartConfig: any;
  chartData: any;
  showAnswers?: boolean | undefined;
}) {
  const pathname = usePathname();
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);

  const handleAnswersChange = (form_id: string) => {
    if (form_id) {
      params.set('form_id', form_id);
    } else {
      params.delete('form_id');
    }
    replace(`${pathname}?${params.toString()}`);
    //setear query parameter
  };

  console.log(params.get('form_id'));

  // Encuentra el índice del formulario actual en el chartData
  const activeIndex = chartData.findIndex(
    (item: any) => item.browser.replace('_', '_') === form.name.replace('_', '_')
  );

  return (
    <Card className="max-w-xs" x-chunk="charts-01-chunk-3">
      <CardHeader className="p-4 pb-0">
        {showAnswers ? (
          <Button onClick={() => handleAnswersChange(form.id)} variant="outline">
            Ver respuestas
          </Button>
        ) : (
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Completar formulario</Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full p-8 px-12 max-h-[95vh] overflow-y-auto">
                <Card className="p-12">
                  <SubmitCustomForm campos={[form]} />
                </Card>
                <DrawerFooter>
                  <DrawerClose className="hidden" asChild>
                    <Button id="close-drawer" variant="outline">
                      Cancelar
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        )}

        <CardDescription className="text-center">
          {form.form.length - 1} {form.form.length - 1 > 1 ? 'secciones' : 'sección'}
        </CardDescription>
      </CardHeader>
      <FormUseChart chartConfig={chartConfig} formName={form.name} chartData={chartData} activeIndex={activeIndex} />
    </Card>
  );
}

export default FormCard;
