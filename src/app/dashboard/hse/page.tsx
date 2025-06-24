import { fetchTrainings } from '@/components/Capacitaciones/actions/actions';
import { TrainingCreateDialog } from '@/components/Capacitaciones/training-create-dialog';
import TrainingSection from '@/components/Capacitaciones/training-section';
import Viewcomponent from '@/components/ViewComponent';

async function HSEPage() {
  // Obtener los datos de capacitaciones desde la base de datos
  const trainingsResult = await fetchTrainings();

  // Log para debugging
  console.log('Datos obtenidos:', trainingsResult);
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
    ],
  };

  return (
    <div className="h-full">
      <Viewcomponent viewData={viewData} />
    </div>
  );
}

export default HSEPage;
