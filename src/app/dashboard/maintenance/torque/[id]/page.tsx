import { notFound } from 'next/navigation';
import { getTorqueCertificateById } from '@/modules/maintenance/features/torque/actions.server';
import {
  TorqueCertificateDetail,
  type TorqueCertificateDetailData,
} from '@/modules/maintenance/features/torque/components/TorqueCertificateDetail';

// Wrapper fino: trae el certificado guardado y lo serializa para el cliente.
// `vehicle.brand` es BigInt (no cruza el límite server->client), así que se
// convierte a string antes de pasarlo (tsk-575 task 6).
export default async function TorqueCertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certificate = await getTorqueCertificateById(id);
  if (!certificate) return notFound();

  const { vehicle, ...rest } = certificate;
  const serialized: TorqueCertificateDetailData = {
    ...rest,
    vehicleBrandId: vehicle?.brand != null ? vehicle.brand.toString() : null,
  };

  return (
    <div className="py-4 px-6">
      <TorqueCertificateDetail certificate={serialized} />
    </div>
  );
}
