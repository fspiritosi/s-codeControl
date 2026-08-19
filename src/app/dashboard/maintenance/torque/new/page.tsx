import { getVehiclesForTorque } from '@/modules/maintenance/features/torque/actions.server';
import { TorqueCertificateForm } from '@/modules/maintenance/features/torque/components/TorqueCertificateForm';

// Wrapper fino: solo trae los equipos y renderiza el formulario (tsk-575).
export default async function NewTorqueCertificatePage() {
  const vehicles = await getVehiclesForTorque();

  return (
    <div className="py-4 px-6">
      <TorqueCertificateForm vehicles={vehicles} />
    </div>
  );
}
