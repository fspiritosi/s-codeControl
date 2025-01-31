'use client';

import { useLoggedUserStore } from '@/store/loggedUser';
import { VehicleInspectionLayout } from '../layouts/VehicleInspectionLayout';
import dynamic from 'next/dynamic';
import { checklistItems } from '@/components/CheckList/ChecklistSergio';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import { pdf } from '@react-pdf/renderer';

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
  singurl?: string | null;
  title?: string;
  description?: string;
}

export const TransporteSPANAYCHKHYS03 = ({ data, preview = true, companyLogo, singurl, title, description }: VehicleInspectionPDFProps) => {
  const company = useLoggedUserStore((state) => state.actualCompany)?.company_logo;

  console.log(data, 'data keloke');

  const items = [
    {
      title: true,
      label: 'GENERAL',
    },
    {
      label: 'Discos de freno',
      result: data?.general?.['Discos de freno'],
    },
    {
      label: 'Jaula antivuelco',
      result: data?.general?.['Jaula antivuelco'],
    },
    {
      label: 'FRENOS DELANTEROS',
      result: data?.general?.['FRENOS DELANTEROS'],
    },
    {
      label: 'Puertas (cierre efectivo)',
      result: data?.general?.['Puertas (cierre efectivo)'],
    },
    {
      label: 'Espejos retrovisores',
      result: data?.general?.['Espejos retrovisores'],
    },
    {
      label: 'Cristales',
      result: data?.general?.['Cristales'],
    },
    {
      label: 'Lava parabrisas',
      result: data?.general?.['Lava parabrisas'],
    },
    {
      label: 'Paragolpe delantero',
      result: data?.general?.['Paragolpe delantero'],
    },
    {
      label: 'Paragolpe trasero',
      result: data?.general?.['Paragolpe trasero'],
    },
    {
      label: 'Pintura',
      result: data?.general?.['Pintura'],
    },
    {
      label: 'Estado de Parabrisas',
      result: data?.general?.['Estado de Parabrisas'],
    },
    {
      label: 'Limpia parabrisas',
      result: data?.general?.['Limpia parabrisas'],
    },
    {
      label: 'Levantavidrios',
      result: data?.general?.['Levantavidrios'],
    },
    {
      title: true,
      label: 'CARROCERÍA',
    },
    {
      label: 'CARROCERÍA - CHASIS',
      result: data?.carroceria?.['CARROCERÍA - CHASIS'],
    },
    {
      label: 'Chapa',
      result: data?.carroceria?.['Chapa'],
    },
    {
      label: 'Bocina',
      result: data?.carroceria?.['Bocina'],
    },
    {
      label: 'Funcionamiento Tacógrafo',
      result: data?.carroceria?.['Funcionamiento Tacógrafo'],
    },
    {
      label: 'Funcionamiento impresora de tacografo',
      result: data?.carroceria?.['Funcionamiento impresora de tacografo'],
    },
    {
      label: 'Cartel luminoso de limite de velocidad',
      result: data?.carroceria?.['Cartel luminoso de limite de velocidad'],
    },
    {
      label: 'Alarma acústica de limite de velocidad',
      result: data?.carroceria?.['Alarma acústica de limite de velocidad'],
    },
    {
      label: 'Alarma acústica de retroceso',
      result: data?.carroceria?.['Alarma acústica de retroceso'],
    },
    {
      title: true,
      label: 'LUCES',
    },
    {
      label: 'Luces de salida de emergencia',
      result: data?.luces?.['Luces de salida de emergencia'],
    },
    {
      label: 'Luces de tablero (luces testigos)',
      result: data?.luces?.['Luces de tablero (luces testigos)'],
    },
    {
      label: 'Balizas intermitentes',
      result: data?.luces?.['Balizas intermitentes'],
    },
    {
      label: 'Luces de giro delanteras/laterales/traseras',
      result: data?.luces?.['Luces de giro delanteras/laterales/traseras'],
    },
    {
      label: 'Luces de freno',
      result: data?.luces?.['Luces de freno'],
    },
    {
      label: 'Luces de Retroceso',
      result: data?.luces?.['Luces de Retroceso'],
    },
    {
      label: 'Luces Bajas',
      result: data?.luces?.['Luces Bajas'],
    },
    {
      label: 'Luces antiniebla',
      result: data?.luces?.['Luces antiniebla'],
    },
    {
      label: 'Luces de posición delanteras/laterales/traseras',
      result: data?.luces?.['Luces de posición delanteras/laterales/traseras'],
    },
    {
      label: 'Luces Altas',
      result: data?.luces?.['Luces Altas'],
    },
    {
      title: true,
      label: 'MECÁNICA',
    },
    {
      label: 'Frenos delanteros (Estado final)',
      result: data?.mecanica?.['Frenos delanteros (Estado final)'],
    },
    {
      label: 'Pastillas de freno',
      result: data?.mecanica?.['Pastillas de freno'],
    },
    {
      label: 'Calipers de freno',
      result: data?.mecanica?.['Calipers de freno'],
    },
    {
      label: 'Seguros de cardan',
      result: data?.mecanica?.['Seguros de cardan'],
    },
    {
      label: 'ALINEACIÓN',
      result: data?.mecanica?.['ALINEACIÓN'],
    },
    {
      label: 'Crucetas',
      result: data?.mecanica?.['Crucetas'],
    },
    {
      label: 'Centro de cardan',
      result: data?.mecanica?.['Centro de cardan'],
    },
    {
      label: 'Rueda de auxilio',
      result: data?.mecanica?.['Rueda de auxilio'],
    },
    {
      label: 'TRANSMISIÓN',
      result: data?.mecanica?.['TRANSMISIÓN'],
    },
    {
      label: 'Cardan',
      result: data?.mecanica?.['Cardan'],
    },
    {
      title: true,
      label: 'NEUMÁTICOS',
    },
    {
      label: 'Estado bulones de rueda',
      result: data?.neumaticos?.['Estado bulones de rueda'],
    },
    {
      label: 'Ajuste bulones de rueda (Torquímetro)',
      result: data?.neumaticos?.['Ajuste bulones de rueda (Torquímetro)'],
    },
    {
      label: 'Colocación de (Check Points)',
      result: data?.neumaticos?.['Colocación de (Check Points)'],
    },
    {
      label: 'Dibujo neumático (superior a 2mm)',
      result: data?.neumaticos?.['Dibujo neumático (superior a 2mm)'],
    },
    {
      label: 'Llantas',
      result: data?.neumaticos?.['Llantas'],
    },
    {
      label: 'Presión de neumáticos',
      result: data?.neumaticos?.['Presión de neumáticos'],
    },
    {
      title: true,
      label: 'SUSPENSIÓN',
    },
    {
      label: 'Bujes de barra estabilizadora',
      result: data?.suspension?.['Bujes de barra estabilizadora'],
    },
    {
      label: 'TREN RODANTE',
      result: data?.suspension?.['TREN RODANTE'],
    },
    {
      label: 'Estado de neumáticos',
      result: data?.suspension?.['Estado de neumáticos'],
    },
    {
      label: 'Bujes de paquete de elásticos (todos)',
      result: data?.suspension?.['Bujes de paquete de elásticos (todos)'],
    },
    {
      label: 'Juego de masa (Porta masa)',
      result: data?.suspension?.['Juego de masa (Porta masa)'],
    },
    {
      label: 'Casoletas',
      result: data?.suspension?.['Casoletas'],
    },
    {
      title: true,
      label: 'NIVELES',
    },
    {
      label: 'Nivel de liquido refrigerante',
      result: data?.niveles?.['Nivel de liquido refrigerante'],
    },
    {
      label: 'Liquido de freno',
      result: data?.niveles?.['Liquido de freno'],
    },
    {
      label: 'Nivel de agua de lavaparabrisas',
      result: data?.niveles?.['Nivel de agua de lavaparabrisas'],
    },
    {
      label: 'Aceite de diferencial delantero',
      result: data?.niveles?.['Aceite de diferencial delantero'],
    },
    {
      label: 'Aceite de diferencial trasero',
      result: data?.niveles?.['Aceite de diferencial trasero'],
    },
    {
      label: 'Estado de respiradero de diferencial',
      result: data?.niveles?.['Estado de respiradero de diferencial'],
    },
    {
      label: 'Aceite de motor',
      result: data?.niveles?.['Aceite de motor'],
    },
    {
      label: 'Fugas de aceite de caja',
      result: data?.niveles?.['Fugas de aceite de caja'],
    },
    {
      label: 'Aceite de caja',
      result: data?.niveles?.['Aceite de caja'],
    },
    {
      label: 'Fugas de aceite de diferencial',
      result: data?.niveles?.['Fugas de aceite de diferencial'],
    },
    {
      label: 'Fugas de aceite de motor',
      result: data?.niveles?.['Fugas de aceite de motor'],
    },
    {
      title: true,
      label: 'SEGURIDAD',
    },
    {
      label: 'Extintor',
      result: data?.seguridad?.['Extintor'],
    },
    {
      label: 'Bandas reflectivas laterales/frontales (blancas)',
      result: data?.seguridad?.['Bandas reflectivas laterales/frontales (blancas)'],
    },
    {
      label: 'Cartelería de velocidad máxima',
      result: data?.seguridad?.['Cartelería de velocidad máxima'],
    },
    {
      label: 'Bandas reflectivas traseras (rojas)',
      result: data?.seguridad?.['Bandas reflectivas traseras (rojas)'],
    },
    {
      label: 'Martillos de Seguridad',
      result: data?.seguridad?.['Martillos de Seguridad'],
    },
    {
      label: 'Luces de Martillo de Seguridad',
      result: data?.seguridad?.['Luces de Martillo de Seguridad'],
    },
    {
      label: 'Botiquín de PrImeros Auxilios',
      result: data?.seguridad?.['Botiquín de PrImeros Auxilios'],
    },
    {
      title: true,
      label: 'INTERIOR',
    },
    {
      label: 'Radio / estéreo',
      result: data?.interior?.['Radio / estéreo'],
    },
    {
      label: 'Soporte matafuego',
      result: data?.interior?.['Soporte matafuego'],
    },
    {
      label: 'Cinturones de seguridad',
      result: data?.interior?.['Cinturones de seguridad'],
    },
    {
      label: 'Aibags',
      result: data?.interior?.['Aibags'],
    },
    {
      label: 'Asientos (estado / reclinación)',
      result: data?.interior?.['Asientos (estado / reclinación)'],
    },
    {
      label: 'Apoyacabezas',
      result: data?.interior?.['Apoyacabezas'],
    },
    {
      label: 'Calefactor / desempañador',
      result: data?.interior?.['Calefactor / desempañador'],
    },
    {
      label: 'Aire acondicionado',
      result: data?.interior?.['Aire acondicionado'],
    },
    {
      label: 'Instrumental',
      result: data?.interior?.['Instrumental'],
    },
    {
      label: 'Cerraduras',
      result: data?.interior?.['Cerraduras'],
    },
  ];

  const pdfContent = (
    <VehicleInspectionLayout
      title={title||'CHECK LIST INSPECCION VEHICULAR'}
      subtitle="Transporte SP-ANAY - CHK - HYS - 03"
      data={{
        fecha: data?.fecha,
        conductor: data?.chofer,
        interno: data?.interno,
        dominio: data?.dominio,
        kilometraje: data?.kilometraje,
        hora: data?.hora,
        observaciones: data?.observaciones,
      }}
      items={items}
      logoUrl={company}
      singurl={singurl}
    />
  );

  if (!preview) {
    return pdfContent;
  }
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
  return (
    <div className="w-full h-full">
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
      <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>{pdfContent}</PDFViewer>
    </div>
  );
};
