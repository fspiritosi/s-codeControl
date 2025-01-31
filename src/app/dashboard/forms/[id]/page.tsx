import { fetchCustomFormById, fetchFormsAnswersByFormId } from '@/app/server/GET/actions';
import BackButton from '@/components/BackButton';
import Viewcomponent from '@/components/ViewComponent';
import { PDFPreviewDialog } from '@/components/pdf-preview-dialog';

import { TransporteSPANAYCHKHYS01 } from '@/components/pdf/generators/TransporteSPANAYCHKHYS01';
import { TransporteSPANAYCHKHYS03 } from '@/components/pdf/generators/TransporteSPANAYCHKHYS03';
import { TransporteSPANAYCHKHYS04 } from '@/components/pdf/generators/TransporteSPANAYCHKHYS04';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import CheckListAnwersTable from '../components/CheckListAnwersTable';

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

async function page({ params }: { params: { id: string } }) {
  const answers = await fetchFormsAnswersByFormId(params.id);
  const formInfo = await fetchCustomFormById(params.id);
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
              <Link className={buttonVariants({ variant: 'default' })} href={`/dashboard/forms/${params.id}/new`}>
                Nueva respuesta
              </Link>
            </div>
          ),
          title: formName,
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
