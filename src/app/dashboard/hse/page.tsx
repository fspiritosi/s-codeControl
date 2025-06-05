import { TrainingCreateDialog } from '@/components/Capacitaciones/training-create-dialog';
import { TrainingSection } from '@/components/Capacitaciones/training-section';
import { DocumentUploadDialog } from '@/features/Hse/components/Document-upload-dialog';
import { DocumentsSection } from '@/features/Hse/components/Document-section';
import Viewcomponent from '@/components/ViewComponent';
import { cookies } from 'next/headers';
import {getDocuments} from '@/features/Hse/actions/documents'
async function HSEPage() {
  const cookieStore = cookies()
  const company_id = cookieStore.get('actualComp')?.value
  console.log(company_id)
  const documents = await getDocuments(company_id || "")
  
  console.log(documents)

  const viewData = {
    defaultValue: 'trainingsTable',
    tabsValues: [
      {
        value: 'trainingsTable',
        name: 'Capacitaciones',
        restricted: [''],
        content: {
          title: 'Ver capacitaciones',
          description: 'Aquí encontrarás todas las capacitaciones',
          buttonActioRestricted: [''],
          buttonAction: <TrainingCreateDialog />,
          component: <TrainingSection />,
        },
      },
      {
        value: 'documentsTable',
        name: 'Documentos',
        restricted: [''],
        content: {
          title: 'Ver documentos',
          description: 'Aquí encontrarás todos los documentos',
          buttonActioRestricted: [''],
          buttonAction: <DocumentUploadDialog/>,
          component: <DocumentsSection />,
        },
      },
    ],
  };

  return (
    <div className="h-full">
      <Viewcomponent viewData={viewData} />
    </div>
  );
}

export default HSEPage;
