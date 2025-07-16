import { fetchAllTags, fetchTrainings } from '@/components/Capacitaciones/actions/actions';
import { TrainingCreateDialog } from '@/components/Capacitaciones/training-create-dialog';
import TrainingSection from '@/components/Capacitaciones/training-section';
import Viewcomponent from '@/components/ViewComponent';
import type { Document } from '@/features/Hse/actions/documents'; // <-- ¡SÍ!
import { getDocuments, getEmployeesWithAssignedDocuments } from '@/features/Hse/actions/documents';
import { DocumentsSection } from '@/features/Hse/components/Document-section';
import { DocumentUploadDialog } from '@/features/Hse/components/Document-upload-dialog';
import DocTypeTab from '@/features/Hse/doc_types/DocTypeTab';
import { cookies } from 'next/headers';

export type TagType = {
  color: string | null;
  created_at: string | null;
  id: string;
  is_active: boolean;
  name: string;
};

export type TrainingType = {
  id: string;
  title: string;
  description: string;
  createdDate: string;
  tags: (TagType | null)[];
  materials: any[]; // ajusta el tipo real si lo sabes
  evaluation: any; // ajusta el tipo real si lo sabes
  completedCount: number;
  totalEmployees: number;
  status: string;
};

export type EmployeeType = {
  // Agrega aquí los campos que uses para empleados
  id: string;
  name: string;
  // ...
};
async function HSEPage() {
  // Obtener los datos necesarios desde la base de datos
  const cookieStore = cookies();
  const company_id = cookieStore.get('actualComp')?.value;

  // Si no hay company_id, redirigir o manejar el error según corresponda
  if (!company_id) {
    throw new Error('No se pudo obtener el ID de la compañía');
  }

  const results = await Promise.allSettled([
    fetchTrainings(),
    fetchAllTags(),
    getDocuments(company_id),
    getEmployeesWithAssignedDocuments(),
  ]);

  const trainingsResult = results[0].status === 'fulfilled' ? results[0].value : [];
  const tagsResult = results[1].status === 'fulfilled' ? results[1].value : [];
  const documentsResult = results[2].status === 'fulfilled' ? results[2].value : [];
  const employeesResultRaw = results[3].status === 'fulfilled' ? results[3].value : { data: null, error: 'unknown' };
  const employeesResult = employeesResultRaw && employeesResultRaw.data ? employeesResultRaw.data : [];

  function normalizeDocument(doc: any): Document {
    return {
      ...doc,
      description: doc.description ?? undefined,
      expiry_date: doc.expiry_date ?? undefined,
      tags: doc.tags ?? [],
    };
  }

  const viewData = {
    defaultValue: 'trainingsTable',
    tabsValues: [
      {
        value: 'trainingsTable',
        name: 'Capacitaciones',
        restricted: [''],
        content: {
          title: 'Ver capacitaciones',
          description: 'Aquí encontrarás todas las capacitaciones',
          buttonActioRestricted: [''],
          buttonAction: <TrainingCreateDialog />,
          component: <TrainingSection trainings={trainingsResult || []} allTags={tagsResult || []} />,
        },
      },
      {
        value: 'documentsTable',
        name: 'Documentos',
        restricted: [''],
        content: {
          title: 'Ver documentos',
          description: 'Aquí encontrarás todos los documentos',
          buttonActioRestricted: [''],
          buttonAction: <DocumentUploadDialog allTags={tagsResult || []} />,
          component: (
            <DocumentsSection
              initialDocuments={documentsResult.map(normalizeDocument)}
              allTags={tagsResult}
              initialEmployees={employeesResult}
            />
          ),
        },
      },
      {
        value: 'documentsTypeTable',
        name: 'Tipos de Documentos',
        restricted: [''],
        content: {
          title: 'Ver tipos de documentos',
          description: 'Aquí encontrarás todos los tipos de documentos',
          buttonActioRestricted: [''],
          buttonAction: <DocumentUploadDialog allTags={tagsResult || []} />,
          component: <DocTypeTab />,
        },
      },
    ],
  };

  return (
    <div className="h-full">
      <Viewcomponent viewData={viewData} />
    </div>
  );
}

export default HSEPage;
