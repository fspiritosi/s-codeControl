'use client';

import dynamic from 'next/dynamic';

const TransporteSPANAYCHKHYS01 = dynamic(
  () =>
    import('@/modules/hse/features/checklist/components/pdf/generators/TransporteSPANAYCHKHYS01').then(
      (m) => m.TransporteSPANAYCHKHYS01
    ),
  { ssr: false }
);
const TransporteSPANAYCHKHYS03 = dynamic(
  () =>
    import('@/modules/hse/features/checklist/components/pdf/generators/TransporteSPANAYCHKHYS03').then(
      (m) => m.TransporteSPANAYCHKHYS03
    ),
  { ssr: false }
);
const TransporteSPANAYCHKHYS04 = dynamic(
  () =>
    import('@/modules/hse/features/checklist/components/pdf/generators/TransporteSPANAYCHKHYS04').then(
      (m) => m.TransporteSPANAYCHKHYS04
    ),
  { ssr: false }
);

export function FormPreview({ formName }: { formName: string }) {
  switch (formName) {
    case 'Transporte SP-ANAY - CHK - HYS - 01':
      return <TransporteSPANAYCHKHYS01 title="CHECK LIST MANTENIMIENTO VEHICULAR" description="Pdf vacio" preview />;
    case 'Transporte SP-ANAY - CHK - HYS - 03':
      return <TransporteSPANAYCHKHYS03 title="CHECK LIST INSPECCION VEHICULAR" description="Pdf vacio" preview />;
    case 'Transporte SP-ANAY - CHK - HYS - 04':
      return <TransporteSPANAYCHKHYS04 title="INSPERCION DIARIA DE VEHICULO" description="Pdf vacio" preview />;
    default:
      return <div>No hay formulario seleccionado</div>;
  }
}
