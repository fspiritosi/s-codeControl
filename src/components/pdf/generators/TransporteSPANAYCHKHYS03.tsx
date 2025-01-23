'use client';

import { useLoggedUserStore } from '@/store/loggedUser';
import { MaintenanceChecklistLayout } from '../layouts/MaintenanceChecklistLayout';
import dynamic from 'next/dynamic';

// Importación dinámica del PDFViewer
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFViewer),
  { ssr: false }
);

interface MaintenanceChecklistPDFProps {
  data?: {
    movil?: string;
    interno?: string;
    dominio?: string;
    kilometraje?: string;
    chofer?: string;
    fecha?: string;
    hora?: string;
    observaciones?: string;
    general?: Record<string, string>;
    carroceria?: Record<string, string>;
    luces?: Record<string, string>;
    mecanica?: Record<string, string>;
    neumaticos?: Record<string, string>;
    suspension?: Record<string, string>;
    niveles?: Record<string, string>;
    seguridad?: Record<string, string>;
    interior?: Record<string, string>;
    [key: string]: any;
  };
  preview?: boolean;
  companyLogo?: string;
}

export const TransporteSPANAYCHKHYS03 = ({ data, preview = true, companyLogo }: MaintenanceChecklistPDFProps) => {
  const company = useLoggedUserStore((state) => state.actualCompany)?.company_logo;

  const pdfContent = (
    <MaintenanceChecklistLayout
      title="CHECK LIST MANTENIMIENTO VEHICULAR"
      subtitle="Transporte SP-ANAY - CHK - HYS - 03"
      data={{
        fecha: data?.fecha,
        conductor: data?.chofer,
        interno: data?.interno,
        dominio: data?.dominio,
        kilometraje: data?.kilometraje,
        hora: data?.hora,
        general: data?.general,
        carroceria: data?.carroceria,
        luces: data?.luces,
        mecanica: data?.mecanica,
        neumaticos: data?.neumaticos,
        suspension: data?.suspension,
        niveles: data?.niveles,
        seguridad: data?.seguridad,
        interior: data?.interior,
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
