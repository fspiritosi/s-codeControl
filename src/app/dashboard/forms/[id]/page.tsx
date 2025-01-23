import { fetchFormsAnswersByFormId } from '@/app/server/GET/actions';
import BackButton from '@/components/BackButton';
import Viewcomponent from '@/components/ViewComponent';
import { PDFPreviewDialog } from '@/components/pdf-preview-dialog';
import { DailyChecklistPDF } from '@/components/pdf/generators/DailyChecklistPDF';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import CheckListAnwersTable from '../components/CheckListAnwersTable';

async function page({ params }: { params: { id: string } }) {
  const answers = await fetchFormsAnswersByFormId(params.id);

  const viewData = {
    defaultValue: 'anwers',
    tabsValues: [
      {
        value: 'anwers',
        name: 'Respuesta de checklist',
        restricted: [''],
        content: {
          buttonAction: (
            <div className="flex gap-4">
              <BackButton />
              <PDFPreviewDialog 
                title="Inspección Diaria de Vehículo"
                description="Vista previa del formulario vacío"
              >
                <div className="h-full w-full bg-white">
                  <DailyChecklistPDF preview={true} />
                </div>
              </PDFPreviewDialog>
              <Link className={buttonVariants({ variant: 'default' })} href={`/dashboard/forms/${params.id}/new`}>
                Nueva respuesta
              </Link>
            </div>
          ),
          title: `${answers[0]?.form_id.name ?? 'Sin respuestas'}`,
          description: `${(answers[0]?.form_id?.form as any)?.description ?? ''}`,
          buttonActioRestricted: [''],
          component: <CheckListAnwersTable answers={answers} />,
        },
      },
    ],
  };

  return <Viewcomponent viewData={viewData} />;
}

export default page;
