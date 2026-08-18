import { getTorqueCertificates } from '@/modules/maintenance/features/torque/actions.server';
import { TorqueCertificatesList } from '@/modules/maintenance/features/torque/components/TorqueCertificatesList';

// Wrapper fino: solo trae los certificados emitidos y renderiza el listado (tsk-575).
export default async function TorqueCertificatesPage() {
  const certificates = await getTorqueCertificates();

  return (
    <div className="py-4 px-6">
      <TorqueCertificatesList certificates={certificates} />
    </div>
  );
}
