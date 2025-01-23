'use client';

import { useLoggedUserStore } from '@/store/loggedUser';
import { VehicleInspectionLayout } from '../layouts/VehicleInspectionLayout';
import dynamic from 'next/dynamic';

// Importación dinámica del PDFViewer
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFViewer),
  { ssr: false }
);

interface VehicleInspectionPDFProps {
  data?: {
    movil?: string;
    interno?: string;
    dominio?: string;
    kilometraje?: string;
    chofer?: string;
    fecha?: string;
    hora?: string;
    observaciones?: string;
    luces?: Record<string, string>;
    seguridad?: Record<string, string>;
    interior?: Record<string, string>;
    mecanica?: Record<string, string>;
    [key: string]: any;
  };
  preview?: boolean;
  companyLogo?: string;
}

export const TransporteSPANAYCHKHYS01 = ({ data, preview = true, companyLogo }: VehicleInspectionPDFProps) => {
  const company = useLoggedUserStore((state) => state.actualCompany)?.company_logo;

  const pdfContent = (
    <VehicleInspectionLayout
      title="CHECK LIST INSPECCION VEHICULAR"
      subtitle="Transporte SP-ANAY - CHK - HYS - 01"
      data={{
        fecha: data?.fecha,
        conductor: data?.chofer,
        interno: data?.interno,
        dominio: data?.dominio,
        kilometraje: data?.kilometraje,
        hora: data?.hora,
        luces: data?.luces,
        seguridad: data?.seguridad,
        interior: data?.interior,
        mecanica: data?.mecanica,
        observaciones: data?.observaciones,
      }}
      logoUrl={company}
    />
  );

  if (!preview) {
    return pdfContent;
  }

  return (
    <div className="w-full h-full">
      <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
        {pdfContent}
      </PDFViewer>
    </div>
  );
};
