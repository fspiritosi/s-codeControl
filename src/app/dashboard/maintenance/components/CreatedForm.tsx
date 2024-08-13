'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Table, TableBody, TableCaption, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Campo } from '@/types/types';
import { useEffect, useState } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { types } from '@/types/types';
import cookie from 'js-cookie';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import DisplayCreatedForms from './DisplayCreatedForms';
import FormCard from './FormCard';
import { FormDisplay } from './FormDisplay';
const generateChartConfig = (data: any, category: string) => {
  const categoryConfig: any = {};
  data[category]?.forEach((item: any, index: number) => {
    const key = item.name ? item.name.replace(/_/g, ' ') : `item_${index}`;

    categoryConfig[key] = {
      label: item.name.replace(/_/g, ' ') || `Item ${index + 1}`,
      color: 'hsl(var(--chart-5))',
    };
  });

  return { [category]: categoryConfig };
};
const generateChartData = (categoryConfig: any, forms: any[]) => {
  // Obtener los últimos 6 meses en español
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = d.toLocaleString('es', { month: 'long' });
    months.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));
  }

  // Mapear cada mes a su correspondiente objeto de datos
  return months.map((month) => {
    // Filtrar formularios por mes
    const filteredForms = forms.filter((f) => {
      const formDate = new Date(f.created_at);
      const formMonthName =
        formDate.toLocaleString('es', { month: 'long' }).charAt(0).toUpperCase() +
        formDate.toLocaleString('es', { month: 'long' }).slice(1);
      return formMonthName === month;
    });

    // Sumar todas las respuestas de los formularios filtrados

    // Obtener el color correspondiente del mes
    const item = categoryConfig[month.replace(/_/g, ' ')] || { color: 'defaultColor' };

    return {
      month: month,
      respuestas: filteredForms.length,
    };
  });
};
function CreatedForm() {
  const [createdFormsState, setCreatedFormsState] = useState<any[] | undefined>(undefined);
  const supabase = supabaseBrowser();
  const [forms, setForms] = useState<any[] | null>([]);
  const [campos, setCampos] = useState<Campo[]>([
    {
      tipo: types.NombreFormulario,
      placeholder: 'Ingresa el nombre del formulario',
      id: '1',
      title: 'Nombre del formulario',
      opciones: [],
    },
  ]);
  const [selectedForm, setSelectedForm] = useState<Campo[] | undefined>([]);
  const companyId = cookie.get('actualComp');
  const fetchForms = async () => {
    if (!companyId) return;
    const { data, error } = await supabase.from('custom_form').select('*').eq('company_id', companyId);
    if (error) {
      console.log(error);
    }
    if (data) {
      setCreatedFormsState(data);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const pathname = usePathname();
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);
  const formId = params.get('form_id');

  const fetchAnswers = async () => {
    let { data: form_answers, error } = await supabase
      .from('form_answers')
      .select('*,form_id(*)')
      .eq('form_id', formId);
    setForms(form_answers);
  };

  useEffect(() => {
    if (formId) fetchAnswers();
  }, [formId]);

  const formKeys = Object.keys(JSON.parse(forms?.[0]?.answer || '{}'));
  const handleAnswersDelete = () => {
    params.delete('form_id');
    replace(`${pathname}?${params.toString()}`);
  };
  console.log(forms);

  const chartConfig = generateChartConfig(forms, 'company');
  console.log(chartConfig);
  const chartData = generateChartData(chartConfig || {}, forms || []);
  console.log(chartData);

  return (
    <div>
      {formId ? (
        <Card className="p-4 flex flex-col">
          <div className="flex gap-4 justify-end">
            <Button variant={'outline'} className="self-end" onClick={() => handleAnswersDelete()}>
              Volver
            </Button>
            <Button className="self-end">Imprimir vacio</Button>
          </div>
          {forms?.length === 0 ? (
            <>No hay respuestas</>
          ) : (
            <>
              {' '}
              <Badge className="w-fit mb-3">
                <CardTitle className="text-xl ">
                  {forms?.[0]?.form_id?.form.find((e: any) => e.id === '1').value}
                </CardTitle>
              </Badge>
              <div className="flex ">
                <div className="min-w-[25%]">
                  <FormCard
                    fetchAnswers={fetchAnswers}
                    chartConfig={chartConfig}
                    chartData={chartData}
                    key={0}
                    form={forms?.[0]?.form_id}
                  />
                </div>
                <Table>
                  <TableCaption>Lista de respuestas del formulario</TableCaption>
                  <TableHeader>
                    <TableRow>
                      {formKeys.map((key, index) => {
                        return <TableCell key={index}>{key.replaceAll('_', ' ')}</TableCell>;
                      })}
                      <TableCell>Imprimir</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forms?.map((formItem: any, formIndex) => (
                      <TableRow key={formIndex}>
                        {formKeys.map((key, index) => {
                          const value = JSON.parse(formItem.answer)[key];
                          // Comprobar si el valor parece una fecha
                          const isDate =
                            typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value);
                          const formattedValue = isDate ? new Date(value).toLocaleDateString() : value;
                          return (
                            <TableCell key={index}>
                              {Array.isArray(formattedValue) ? (
                                <div className="gap-2 flex flex-col">
                                  {formattedValue.map((item, itemIndex) => (
                                    <Badge key={itemIndex}>{item}</Badge>
                                  ))}
                                </div>
                              ) : (
                                formattedValue
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell>
                          <Button>Imprimir</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </Card>
      ) : (
        <TooltipProvider delayDuration={0}>
          <ResizablePanelGroup direction="horizontal" className="h-full max-h-[800px] items-stretch p-0 m-0">
            <ResizablePanel minSize={30}>
              <DisplayCreatedForms createdForms={createdFormsState} setSelectedForm={setSelectedForm} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel className="relative" minSize={30}>
              <div className="absolute inset-0 h-full w-full bg-white dark:bg-slate-950/70 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:16px_16px] rounded-e-xl rounded "></div>
              <FormDisplay
                campos={selectedForm ?? campos}
                selectedForm={selectedForm}
                setCampos={setCampos}
                fetchForms={fetchForms}
                created
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </TooltipProvider>
      )}
    </div>
  );
}

export default CreatedForm;
