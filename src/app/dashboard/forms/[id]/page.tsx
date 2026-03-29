import { fetchFormsAnswersByFormId } from '@/modules/forms/features/answers/actions.server';
import { fetchCustomFormById } from '@/modules/forms/features/custom-forms/actions.server';
import BackButton from '@/shared/components/common/BackButton';
import Viewcomponent from '@/shared/components/common/ViewComponent';
import { PDFPreviewDialog } from '@/shared/components/pdf/PDFPreviewDialog';

import dynamic from 'next/dynamic';

const TransporteSPANAYCHKHYS01 = dynamic(
  () => import('@/modules/hse/features/checklist/components/pdf/generators/TransporteSPANAYCHKHYS01').then(m => m.TransporteSPANAYCHKHYS01),
  { ssr: false }
);
const TransporteSPANAYCHKHYS03 = dynamic(
  () => import('@/modules/hse/features/checklist/components/pdf/generators/TransporteSPANAYCHKHYS03').then(m => m.TransporteSPANAYCHKHYS03),
  { ssr: false }
);
const TransporteSPANAYCHKHYS04 = dynamic(
  () => import('@/modules/hse/features/checklist/components/pdf/generators/TransporteSPANAYCHKHYS04').then(m => m.TransporteSPANAYCHKHYS04),
  { ssr: false }
);
import { buttonVariants } from '@/shared/components/ui/button';
import Link from 'next/link';
import CheckListAnwersTable from '@/modules/forms/features/custom-forms/components/CheckListAnwersTable';

const renderForm = (activeFormType: string) => {
  switch (activeFormType) {
    case 'Transporte SP-ANAY - CHK - HYS - 01':
      return <TransporteSPANAYCHKHYS01 title="CHECK LIST MANTENIMIENTO VEHICULAR" description="Pdf vacio" preview />;
    case 'Transporte SP-ANAY - CHK - HYS - 03':
      return <TransporteSPANAYCHKHYS03 title="CHECK LIST INSPECCION VEHICULAR" description="Pdf vacio" preview />;
    case 'Transporte SP-ANAY - CHK - HYS - 04':
      return <TransporteSPANAYCHKHYS04 title="INSPERCION DIARIA DE VEHICULO" description="Pdf vacio" preview />;
    default:
      return <div>No hay formulario seleccionado</div>;
  }
};

async function page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const answers = await fetchFormsAnswersByFormId(id);
  const formInfo = await fetchCustomFormById(id);
  const formName = formInfo[0].name;

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
                buttonText="Imprimir vacío"
                title={formName}
                description="Vista previa del formulario vacío"
              >
                <div className="h-full w-full bg-white">{renderForm(formName)}</div>
              </PDFPreviewDialog>
              <Link className={buttonVariants({ variant: 'default' })} href={`/dashboard/forms/${id}/new`}>
                Nueva respuesta
              </Link>
            </div>
          ),
          title: formName,
          description: `${((answers[0] as unknown as CheckListAnswerWithForm)?.form_id?.form as Record<string, unknown>)?.description ?? ''}`,
          buttonActioRestricted: [''],
          component: <CheckListAnwersTable answers={answers as unknown as CheckListAnswerWithForm[]} />,
        },
      },
    ],
  };

  return <Viewcomponent viewData={viewData} />;
}

export default page;
