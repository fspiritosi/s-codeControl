'use client';

import { useLoggedUserStore } from '@/store/loggedUser';
import dynamic from 'next/dynamic';
import { MaintenanceChecklistLayout } from '../layouts/MaintenanceChecklistLayout';

// Importación dinámica del PDFViewer
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), { ssr: false });

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
    // general?: Record<string, string>;
    // carroceria?: Record<string, string>;
    // luces?: Record<string, string>;
    // mecanica?: Record<string, string>;
    // neumaticos?: Record<string, string>;
    // suspension?: Record<string, string>;
    // niveles?: Record<string, string>;
    // seguridad?: Record<string, string>;
    // interior?: Record<string, string>;
    asientosEstado?: string;
    lucesAltas?: string;
    lucesBajas?: string;
    lucesGiro?: string;
    balizas?: string;
    lucesRetroceso?: string;
    lucesFreno?: string;
    lucesEstacionamiento?: string;
    funcionamientoTacografo?: string;
    funcionesTablero?: string;
    bocina?: string;
    alarmaRetroceso?: string;
    calefactorDesempanador?: string;
    aireAcondicionado?: string;
    limpiaParabrisas?: string;
    parasol?: string;
    luneta?: string;
    ventanillaApertura?: string;
    ventanillaCierre?: string;
    puertasCierre?: string;
    espejoRetrovisor?: string;
    espejosLaterales?: string;
    cortinasSogasSoportes?: string;
    cinturones?: string;
    apoyaCabezas?: string;
    apoyaCabezas2?: string;
    botiquin?: string;
    balizasTriangulares?: string;
    chalecosReflectantes?: string;
    revisionCheckPoint?: string;
    arrestallamas?: string;
    airbagsFrontales?: string;
    matafuego?: string;
    suspension?: string;
    criquet?: string;
    filtroAire?: string;
    bateria?: string;
    nivelFluidos?: string;
    sistemaFreno?: string;
    nivelFluidos2?: string;
    carteleriaVelocidad?: string;
    bandasLaterales?: string;
    nivelCombustible?: string;
    neumaticoAuxilio?: string;
    neumaticosDelanteros?: string;
    neumaticosTraseros?: string;
    esparragosTorque?: string;
    elementosSueltos?: string;
    bolsasResiduos?: string;
    limpiezaCabina?: string;
    [key: string]: any;
  };
  preview?: boolean;
  companyLogo?: string;
  singurl?: string | null;
}

export const TransporteSPANAYCHKHYS01 = ({ data, preview = true, singurl }: MaintenanceChecklistPDFProps) => {
  const company = useLoggedUserStore((state) => state.actualCompany)?.company_logo;

  const items = [
    {
      title: true,
      label: 'LUCES',
    },
    {
      label: 'Asientos (Estado en general)',
      result: data?.asientosEstado,
    },
    {
      label: 'Luces Altas',
      result: data?.lucesAltas,
    },
    {
      label: 'Luces Bajas',
      result: data?.lucesBajas,
    },
    {
      label: 'Luces de Giro',
      result: data?.lucesGiro,
    },
    {
      label: 'Balizas',
      result: data?.balizas,
    },
    {
      label: 'Luces de Retroceso',
      result: data?.lucesRetroceso,
    },
    {
      label: 'Luces Freno',
      result: data?.lucesFreno,
    },
    {
      label: 'Luces de Estacionamiento',
      result: data?.lucesEstacionamiento,
    },
    {
      title: true,
      label: 'INTERIOR',
    },
    {
      label: 'Funcionamiento Tacógrafo (Microtrack)',
      result: data?.funcionamientoTacografo,
    },
    {
      label: 'Funciones de tablero (luces testigo)',
      result: data?.funcionesTablero,
    },
    {
      label: 'Bocina',
      result: data?.bocina,
    },
    {
      label: 'Alarma de Retroceso',
      result: data?.alarmaRetroceso,
    },
    {
      label: 'Calefactor Desempañador',
      result: data?.calefactorDesempanador,
    },
    {
      label: 'Aire Acondicionado',
      result: data?.aireAcondicionado,
    },
    {
      label: 'Limpia Parabrisas y Lava Parabrisas',
      result: data?.limpiaParabrisas,
    },
    {
      label: 'Parasol',
      result: data?.parasol,
    },
    {
      label: 'Luneta',
      result: data?.luneta,
    },
    {
      label: 'Ventanilla (apertura)',
      result: data?.ventanillaApertura,
    },
    {
      label: 'Ventanilla (Cierre)',
      result: data?.ventanillaCierre,
    },
    {
      label: 'Puertas (cierre efectivo)',
      result: data?.puertasCierre,
    },
    {
      label: 'Espejo retrovisor',
      result: data?.espejoRetrovisor,
    },
    {
      label: 'Espejos laterales',
      result: data?.espejosLaterales,
    },
    {
      label: 'Cortinas/ Sogas / Soportes',
      result: data?.cortinasSogasSoportes,
    },
    {
      label: 'Cinturones de seguridad',
      result: data?.cinturones,
    },
    {
      label: 'Apoya cabezas',
      result: data?.apoyaCabezas,
    },
    {
      title: true,
      label: 'SEGURIDAD / ACCESORIOS',
    },
    {
      label: 'BOTIQUIN PRIMEROS AUXILIOS',
      result: data?.botiquin,
    },
    {
      label: 'Balizas triangulares / conos',
      result: data?.balizasTriangulares,
    },
    {
      label: 'Chalecos reflectantes',
      result: data?.chalecosReflectantes,
    },
    {
      label: 'Apoya cabezas',
      result: data?.apoyaCabezas2,
    },
    {
      label: 'Revisión check Point/check Nut',
      result: data?.revisionCheckPoint,
    },
    {
      label: 'Arrestallamas',
      result: data?.arrestallamas,
    },
    {
      label: 'Airbags frontales',
      result: data?.airbagsFrontales,
    },
    {
      label: 'Matafuego',
      result: data?.matafuego,
    },
    {
      title: true,
      label: 'MECANICA/MOTOR',
    },
    {
      label: 'Suspensión (Amortiguadores)',
      result: data?.suspension,
    },
    {
      label: 'Criquet (Gato) y llave de rueda',
      result: data?.criquet,
    },
    {
      label: 'Filtro de Aire: Motor/Habitaculo Sopletear',
      result: data?.filtroAire,
    },
    {
      label: 'Batería/Estado',
      result: data?.bateria,
    },
    {
      label: 'Nivel de fluidos y pérdidas',
      result: data?.nivelFluidos,
    },
    {
      label: 'Sistema de Freno (ABS)',
      result: data?.sistemaFreno,
    },
    {
      label: 'Nivel de fluidos y pérdidas',
      result: data?.nivelFluidos2,
    },
    {
      label: 'Cartelería de velocidad máxima',
      result: data?.carteleriaVelocidad,
    },
    {
      label: 'Bandas laterales reflectivas',
      result: data?.bandasLaterales,
    },
    {
      label: 'Nivel de combustible',
      result: data?.nivelCombustible,
    },
    {
      label: 'Neumatico de auxilio',
      result: data?.neumaticoAuxilio,
    },
    {
      label: 'Neumaticos Delanteros',
      result: data?.neumaticosDelanteros,
    },
    {
      label: 'Neumaticos Traseros',
      result: data?.neumaticosTraseros,
    },
    {
      label: 'Esparragos y Torque',
      result: data?.esparragosTorque,
    },
    {
      label: 'Elementos sueltos',
      result: data?.elementosSueltos,
    },
    {
      label: 'Bolsas para depósito de residuos',
      result: data?.bolsasResiduos,
    },
    {
      label: 'Limpieza de Cabina y Exterior',
      result: data?.limpiezaCabina,
    },
  ];

  const pdfContent = (
    <MaintenanceChecklistLayout
      title="CHECK LIST MANTENIMIENTO VEHICULAR"
      subtitle="Transporte SP-ANAY - CHK - HYS - 01"
      data={{
        fecha: data?.fecha,
        dominio: data?.dominio,
        kilometraje: data?.kilometraje,
        hora: data?.hora,
        observaciones: data?.observaciones,
        chofer: data?.chofer,
      }}
      logoUrl={company}
      items={items}
      singurl={singurl}
    />
  );

  if (!preview) {
    return pdfContent;
  }

  return (
    <div className="w-full h-full">
      <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>{pdfContent}</PDFViewer>
    </div>
  );
};
