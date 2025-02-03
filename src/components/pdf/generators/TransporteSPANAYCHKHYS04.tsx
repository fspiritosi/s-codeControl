'use client';

import { Button } from '@/components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLoggedUserStore } from '@/store/loggedUser';
import { pdf } from '@react-pdf/renderer';
import moment from 'moment';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { BaseChecklistLayout } from '../layouts/BaseChecklistLayout';

// Importación dinámica del PDFViewer
const PDFViewerDynamic = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), { ssr: false });

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
  singurl?: string | null;
  title?: string;
  description?: string;
}

export const TransporteSPANAYCHKHYS04 = ({
  data,
  preview = true,
  singurl,
  title,
  description,
}: DailyChecklistPDFProps) => {
  const [client, setClient] = useState(false);

  useEffect(() => {
    setClient(true);
  }, []);

  const items = [
    {
      label: 'Verificar funcionamiento de todas las luces, altas bajas, de frenos, de posición, giro, balizas',
      result: data?.luces,
    },
    {
      label: 'Alarma acústica de retroceso en funcionamiento',
      result: data?.alarmaRetroceso,
    },
    {
      label: 'Parabrisas, ventanillas y espejos limpios en buen estado',
      result: data?.parabrisasEspejos,
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
      label: 'Arrestallamas (si corresponde)',
      result: data?.arrestallamas,
    },
    {
      label:
        'Neumáticos en buen estado, con correcta presión de aire, bien ajustados y con chochomoños en todas las tuercas',
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
    },
  ];

  const company = useLoggedUserStore((state) => state.actualCompany)?.company_logo;

  const pdfContent = (
    <BaseChecklistLayout
      data={{
        fecha: data?.fecha?moment(data?.fecha).format('DD-MM-YYYY'):undefined,
        conductor: data?.chofer,
        interno: data?.interno,
        dominio: data?.dominio,
        servicio: data?.servicio,
        marca: data?.marca,
        modelo: data?.modelo,
        items: items,
        kilometers: data?.kilometraje,
        aptoParaOperar: data?.aptoParaOperar,
      }}
      logoUrl={company}
      singurl={singurl}
    />
  );

  const handleDownload = async () => {
    const blob = await pdf(pdfContent).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Generar nombre personalizado
    const fileName =
      `${title}_${data?.dominio || ''}-(${moment(data?.fecha).format('DD-MM-YYYY') ? moment(data?.fecha).format('DD-MM-YYYY') : ''}).pdf`.replace(
        /\s+/g,
        '_'
      );
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!client) return null;

  if (!preview) {
    return pdfContent;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className=" pr-8 flex items-center justify-between">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Button onClick={handleDownload} variant="outline" className="gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Descargar PDF
        </Button>
      </div>
      <PDFViewerDynamic style={{ width: '100%', height: '100%', border: 'none' }}>{pdfContent}</PDFViewerDynamic>
    </div>
  );
};
