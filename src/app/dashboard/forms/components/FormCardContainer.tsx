'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { FormData } from '@/types/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import FormCard from './FormCard';

const generateChartConfig = (data: any, category: string) => {
  const categoryConfig: any = {};
  data[category].forEach((item: any, index: number) => {
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
    // Encuentra el formulario correspondiente usando el nombre clave
    const form = forms.find((f) => f.name === month);
    const item = categoryConfig[month.replace(/_/g, ' ')] || { color: 'defaultColor' }; // Asegurar que item no sea undefined
    return {
      month: month, // Usar el nombre del mes como identificador
      respuestas: form ? (form.form_answers.length === 0 ? 1 : form.form_answers.length) : 10, // Asignar valor a desktop
      fill: item.color, // Usar el color especificado en categoryConfig o un color por defecto
    };
  });
};

// Definir el tipo de los formularios agrupados
interface GroupedForms {
  employees: FormData[];
  equipment: FormData[];
  company: FormData[];
  documents: FormData[];
}

// Definir el tipo para los formularios con 'apply'
interface FormWithApply {
  id: string;
  tipo: string;
  title: string;
  value?: string;
  opciones: string[];
  placeholder: string;
  apply?: keyof GroupedForms;
}

function FormCardContainer({
  form,
  employees,
  documents,
  equipment,
  company,
  showAnswers,
}: {
  form: FormData[];
  employees?: boolean;
  documents?: boolean;
  equipment?: boolean;
  company?: boolean;
  showAnswers?: boolean;
}) {
  const [formData, setFormData] = useState<FormData[]>(form);
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams as any);
  const formId = params.get('form_id');

  const groupedForms: GroupedForms = formData?.reduce(
    (acc, curr) => {
      const mainForm = curr.form.find((f) => f.id === '1') as FormWithApply | undefined;
      if (mainForm && mainForm.apply) {
        const key = mainForm.apply;
        if (acc[key]) {
          acc[key].push(curr as never);
        }
      }
      return acc;
    },
    {
      employees: [],
      equipment: [],
      company: [],
      documents: [],
    }
  );

  const defaultValue = employees
    ? 'employees'
    : equipment
      ? 'equipment'
      : company
        ? 'company'
        : documents
          ? 'documents'
          : '';

  const pathname = usePathname();

  const chartConfigForEmployees = generateChartConfig(groupedForms, 'employees');
  const chartDataForEmployees = generateChartData(chartConfigForEmployees.employees || {}, groupedForms.employees);

  const chartConfigForEquipment = generateChartConfig(groupedForms, 'equipment');
  const chartDataForEquipment = generateChartData(chartConfigForEquipment.equipment || {}, groupedForms.equipment);

  const chartConfigForCompany = generateChartConfig(groupedForms, 'company');
  const chartDataForCompany = generateChartData(chartConfigForCompany.company || {}, groupedForms.company);

  const chartConfigForDocuments = generateChartConfig(groupedForms, 'documents');
  const chartDataForDocuments = generateChartData(chartConfigForDocuments.documents || {}, groupedForms.documents);

  const { replace } = useRouter();
  const handleAnswersChange = () => {
    params.delete('form_id');
    replace(`${pathname}?${params.toString()}`);
  };

  const [forms, setForms] = useState<any[] | null>([]);
  const supabase = supabaseBrowser();

  const fetchAnswers = async () => {
    let { data: form_answers, error } = await supabase
      .from('form_answers')
      .select('*,form_id(*)')
      .eq('form_id', formId || '');
    setForms(form_answers);
  };

  useEffect(() => {
    if (formId) fetchAnswers();
  }, [formId]);

  const formKeys = Object.keys(JSON.parse(forms?.[0]?.answer || '{}'));

  return (
    <>
      {formId ? (
        <Card className="p-4 flex flex-col">
          <Button className="self-end" onClick={() => handleAnswersChange()}>
            Volver
          </Button>
          <CardTitle className="text-xl mb-3">
            {forms?.[0]?.form_id?.form.find((e: any) => e.id === '1').value}
          </CardTitle>
          <Table>
            <TableCaption>Lista de respuestas del formulario</TableCaption>
            <TableHeader>
              <TableRow>
                {formKeys.map((key, index) => {
                  return <TableCell key={crypto.randomUUID()}>{key.replaceAll('_', ' ')}</TableCell>;
                })}
                <TableCell>Imprimir</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms?.map((formItem, formIndex) => (
                <TableRow key={formIndex}>
                  {formKeys.map((key, index) => {
                    const value = JSON.parse(formItem.answer)[key];
                    // Comprobar si el valor parece una fecha
                    const isDate =
                      typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value);
                    const formattedValue = isDate ? new Date(value).toLocaleDateString() : value;
                    return (
                      <TableCell key={crypto.randomUUID()}>
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
        </Card>
      ) : (
        <Tabs defaultValue={defaultValue}>
          <TabsList className="mb-3">
            {employees && <TabsTrigger value="employees">Empleados</TabsTrigger>}
            {equipment && <TabsTrigger value="equipment">Vehículos</TabsTrigger>}
            {company && <TabsTrigger value="company">Empresa</TabsTrigger>}
            {documents && <TabsTrigger value="documents">Documentos</TabsTrigger>}
          </TabsList>
          <TabsContent value="employees">
            <section>
              <div className="flex gap-4 flex-wrap">
                {groupedForms.employees?.map((form: FormData, index: number) => (
                  <FormCard
                    chartConfig={chartConfigForEmployees}
                    chartData={chartDataForEmployees}
                    key={crypto.randomUUID()}
                    form={form}
                  />
                ))}
              </div>
            </section>
          </TabsContent>
          <TabsContent value="equipment">
            <section>
              <div className="flex gap-4 flex-wrap">
                {groupedForms.equipment?.map((form: FormData, index: number) => (
                  <FormCard
                    chartConfig={chartConfigForEquipment}
                    chartData={chartDataForEquipment}
                    key={crypto.randomUUID()}
                    form={form}
                  />
                ))}
              </div>
            </section>
          </TabsContent>
          <TabsContent value="company">
            <section>
              <div className="flex gap-4 flex-wrap">
                {groupedForms.company?.map((form: FormData, index: number) => (
                  <FormCard
                    chartConfig={chartConfigForCompany}
                    chartData={chartDataForCompany}
                    key={crypto.randomUUID()}
                    form={form}
                  />
                ))}
              </div>
            </section>
          </TabsContent>
          <TabsContent value="documents">
            <section>
              <div className="flex gap-4 flex-wrap">
                {groupedForms.documents?.map((form: FormData, index: number) => (
                  <FormCard
                    chartConfig={chartConfigForDocuments}
                    chartData={chartDataForDocuments}
                    key={crypto.randomUUID()}
                    form={form}
                  />
                ))}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
export default FormCardContainer;
