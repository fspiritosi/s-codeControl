import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerTrigger } from '@/components/ui/drawer';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormUseChart } from './FormUseChart';
import { SubmitCustomForm } from './SubmitCustomForm';

function FormCard({
  form,
  chartConfig,
  chartData,
  fetchAnswers,
}: {
  form: any;
  chartConfig: any;
  chartData: any;
  fetchAnswers?: () => Promise<void>;
}) {

  // Encuentra el índice del formulario actual en el chartData

  return (
    <Card className="max-w-xs" x-chunk="charts-01-chunk-3">
      <CardHeader className="p-4 pb-0">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Completar formulario</Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full p-8 px-12 max-h-[95vh] overflow-y-auto">
              <Card className="p-12">
                <SubmitCustomForm fetchAnswers={fetchAnswers} campos={[form]} />
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
        <CardDescription className="text-center">
          {form?.form?.length - 1} {form?.form?.length - 1 > 1 ? 'secciones' : 'sección'}
        </CardDescription>
      </CardHeader>
      <FormUseChart chartConfig={chartConfig} formName={form?.name} chartData={chartData} />
    </Card>
  );
}

export default FormCard;
