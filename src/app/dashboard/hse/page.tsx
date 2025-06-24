import { fetchTrainings } from '@/components/Capacitaciones/actions/actions';
import { TrainingCreateDialog } from '@/components/Capacitaciones/training-create-dialog';
import TrainingSection from '@/components/Capacitaciones/training-section';
import Viewcomponent from '@/components/ViewComponent';
import { DocumentsSection } from '@/features/Hse/components/Document-section';
import { DocumentUploadDialog } from '@/features/Hse/components/Document-upload-dialog';

async function HSEPage() {
  // Obtener los datos de capacitaciones desde la base de datos
  const trainingsResult = await fetchTrainings();
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
          component: <TrainingSection trainings={trainingsResult} />,
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
          buttonAction: <DocumentUploadDialog />,
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
