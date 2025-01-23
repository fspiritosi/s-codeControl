'use client';

import { useLoggedUserStore } from '@/store/loggedUser';
import { BaseChecklistLayout } from '../layouts/BaseChecklistLayout';
import dynamic from 'next/dynamic';

// Importación dinámica del PDFViewer
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFViewer),
  { ssr: false }
);

interface DailyChecklistPDFProps {
  data?: {
    movil?: string;
    interno?: string;
    dominio?: string;
    kilometraje?: string;
    modelo?: string;
    marca?: string;
    chofer?: string;
    servicio?: string;
    fecha?: string;
    luces?: string;
    licencia?: string;
    puertas?: string;
    extintor?: string;
    estadoGeneral?: string;
    seguro?: string;
    verificacionTecnica?: string;
    alarma?: string;
    parabrisas?: string;
    frenos?: string;
    fluidos?: string;
    matafuegos?: string;
    neumaticos?: string;
    ruedaAuxilio?: string;
    kitHerramientas?: string;
    botiquin?: string;
    manejoDefensivo?: string;
    [key: string]: any;
  };
  preview?: boolean;
  companyLogo?: string;
}

export const DailyChecklistPDF = ({ data, preview = true, companyLogo }: DailyChecklistPDFProps) => {
  const items = [
    {
      label: 'Verificar funcionamiento de todas las luces, altas bajas, de frenos, de posición, giro, balizas',
      result: data?.luces,
    },
    {
      label: 'Alarma acústica de retroceso en funcionamiento',
      result: data?.alarma,
    },
    {
      label: 'Parabrisas, ventanillas y espejos limpios en buen estado',
      result: data?.parabrisas,
    },
    {
      label: 'Cierre efectivo de puertas',
      result: data?.puertas,
    },
    {
      label: 'Verificar correcto funcionamiento de frenos, freno de mano',
      result: data?.frenos,
    },
    {
      label: 'Correcto nivel de fluidos, lubricantes, verificar fugas. Suficiente combustible',
      result: data?.fluidos,
    },
    {
      label: 'Matafuegos (si corresponde)',
      result: data?.matafuegos,
    },
    {
      label: 'Neumáticos en buen estado, con correcta presión de aire, bien ajustados y con chochomoños en todas las tuercas',
      result: data?.neumaticos,
    },
    {
      label: 'Ruedas de auxilio si están a disposición y se encuentran en buen estado',
      result: data?.ruedaAuxilio,
    },
    {
      label: 'Kit de herramientas, balizas si se encuentran disponibles y en buen estado. Gato Hidráulico',
      result: data?.kitHerramientas,
    },
    {
      label: 'Botiquín de primeros auxilios',
      result: data?.botiquin,
    },
    {
      label: 'Extintor presente, recarga en fecha vigente',
      result: data?.extintor,
    },
    {
      label: 'Estado y aspecto gral correcto',
      result: data?.estadoGeneral,
    },
    {
      label: 'Seguro: vigente',
      result: data?.seguro,
    },
    {
      label: 'Verificación técnica vehicular: Vigente',
      result: data?.verificacionTecnica,
    },
    {
      label: 'Licencia: vigente',
      result: data?.licencia,
    },
    {
      label: 'Manejo defensivo: vigente',
      result: data?.manejoDefensivo,
    }
  ];

  const company = useLoggedUserStore((state) => state.actualCompany)?.company_logo

  const pdfContent = (
    <BaseChecklistLayout
      data={{
        fecha: data?.fecha,
        conductor: data?.chofer,
        interno: data?.interno,
        dominio: data?.dominio,
        servicio: data?.servicio,
        marca: data?.marca,
        modelo: data?.modelo,
        items: items,
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
