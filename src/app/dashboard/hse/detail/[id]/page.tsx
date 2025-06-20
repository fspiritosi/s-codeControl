import TrainingDetail from '@/components/Capacitaciones/trainin-detail-wrapper';
import { fetchTrainingById } from '@/components/Capacitaciones/actions/actions';

export default async function TrainingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  try {
    const training = await fetchTrainingById(id);
    
    if (!training) {
      // Si no se encuentra la capacitación, muestra un mensaje de error
      return (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <h1 className="text-2xl font-bold">Capacitación no encontrada</h1>
          <p className="text-gray-500">La capacitación con ID {id} no existe o fue eliminada.</p>
        </div>
      );
    }
    
    console.log('Training data fetched:', training.id);
    return <TrainingDetail training={training} />;
    
  } catch (error) {
    console.error('Error fetching training:', error);
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h1 className="text-2xl font-bold">Error al cargar la capacitación</h1>
        <p className="text-gray-500">Ocurrió un error al cargar los datos. Por favor intente nuevamente.</p>
      </div>
    );
  }
}
