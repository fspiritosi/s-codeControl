'use client';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { FormData } from '@/types/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AnswerCard from './CardAnswer';
import FormCard from './FormCard';
const generateChartConfig = (data: any, category: string) => {
  const generateColor = (index: number) => `hsl(var(--chart-${index + 1}))`;

  const categoryConfig: any = {};
  data[category].forEach((item: any, index: number) => {
    const key = item.name ? item.name.replace(/_/g, ' ') : `item_${index}`;

    console.log(item.name.replace(/_/g, ' ') || `Item ${index + 1}`);
    console.log(item.name ? item.name.replace(/_/g, ' ') : `item_${index}`);
    categoryConfig[key] = {
      label: item.name.replace(/_/g, ' ') || `Item ${index + 1}`,
      color: generateColor(index),
    };
  });

  return { [category]: categoryConfig };
};

const generateChartData = (categoryConfig: any, forms: any[]) => {
  return Object.keys(categoryConfig).map((key) => {
    // Encuentra el formulario correspondiente usando el nombre clave
    const form = forms.find((f) => f.name === key);
    const item = categoryConfig[key.replace(/_/g, ' ')];
    console.log(form ? form.form_answers.length : 10);
    return {
      browser: key,
      visitors: form.form_answers.length === 0 ? 1 : form.form_answers.length, // Usa form_answers.length
      fill: item.color, // Color específico para el ítem
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
  const params = new URLSearchParams(searchParams);
  const formId = params.get('form_id');

  console.log(formData);

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

  console.log(groupedForms);

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

  console.log(chartConfigForEmployees);
  console.log(chartDataForEmployees);

  const chartConfigForEquipment = generateChartConfig(groupedForms, 'equipment');
  const chartDataForEquipment = generateChartData(chartConfigForEquipment.equipment || {}, groupedForms.equipment);

  console.log(chartConfigForEquipment);
  console.log(chartDataForEquipment);

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
      .eq('form_id', formId);
    setForms(form_answers);
  };

  useEffect(() => {
    if (formId) fetchAnswers();
  }, [formId]);

  return (
    <>
      {formId ? (
        <Card className="p-4 flex flex-col">
          <Button className="self-end" onClick={() => handleAnswersChange()}>
            Volver
          </Button>
          <CardTitle>{forms?.[0]?.form_id?.form.find((e: any) => e.id === '1').value}</CardTitle>
          <div className="mt-4 flex gap-4">
            {forms?.map((formItem, index) => <AnswerCard key={index} data={JSON.parse(formItem.answer)} />)}
          </div>
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
                    showAnswers={showAnswers}
                    chartConfig={chartConfigForEmployees}
                    chartData={chartDataForEmployees}
                    key={index}
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
                    showAnswers={showAnswers}
                    chartConfig={chartConfigForEquipment}
                    chartData={chartDataForEquipment}
                    key={index}
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
                    showAnswers={showAnswers}
                    chartConfig={chartConfigForCompany}
                    chartData={chartDataForCompany}
                    key={index}
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
                    showAnswers={showAnswers}
                    chartConfig={chartConfigForDocuments}
                    chartData={chartDataForDocuments}
                    key={index}
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
