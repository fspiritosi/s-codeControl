import { fetchAllTags, fetchTrainings } from '@/modules/hse/features/training/actions.server';
import TagTab from '@/modules/hse/features/training/components/tags/TagTab';
import { TrainingCreateDialog } from '@/modules/hse/features/training/components/training-create-dialog';
import TrainingSection from '@/modules/hse/features/training/components/training-section';
import Viewcomponent from '@/shared/components/common/ViewComponent';
import type { Document } from '@/modules/hse/features/documents/actions.server';
import { fetchAllHseDocTypes, getDocuments, getEmployeesWithAssignedDocuments } from '@/modules/hse/features/documents/actions.server';
import { DocumentsSection } from '@/modules/hse/features/documents/components/Document-section';
import { DocumentUploadDialog } from '@/modules/hse/features/documents/components/Document-upload-dialog';
import DocTypeTab from '@/modules/hse/features/documents/components/doc_types/DocTypeTab';
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
  const cookieStore = await cookies();
  const company_id = cookieStore.get('actualComp')?.value;

  // Si no hay company_id, redirigir o manejar el error según corresponda
  if (!company_id) {
    throw new Error('No se pudo obtener el ID de la compañía');
  }

  const results = await Promise.allSettled([
    fetchTrainings(),
    fetchAllTags(),
    getDocuments(company_id),

    getEmployeesWithAssignedDocuments(company_id),
    fetchAllHseDocTypes(company_id)

  ]);

  const trainingsResult = results[0].status === 'fulfilled' ? results[0].value : [];
  const tagsResult = results[1].status === 'fulfilled' ? results[1].value : [];
  const documentsResult = results[2].status === 'fulfilled' ? results[2].value : [];
  const employeesResultRaw = results[3].status === 'fulfilled' ? results[3].value : { data: null, error: 'unknown' };
  const employeesResult =
    employeesResultRaw && employeesResultRaw.data
      ? employeesResultRaw.data
      : [];
  

  function normalizeDocument(doc: any): Document {
    return {
      ...doc,
      description: doc.description ?? undefined,
      expiry_date: doc.expiry_date ?? undefined,
      tags: doc.tags ?? [],
    };
  }
  const docTypesResult = results[4].status === 'fulfilled' ? results[4].value : [];


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
              docTypes={docTypesResult}
            />
          ),
        },
      },
      {
        value: 'tags',
        name: 'Etiquetas',
        restricted: [''],
        content: {
          title: 'Ver etiquetas',
          description: 'Aquí encontrarás todas las etiquetas',
          buttonActioRestricted: [''],
          buttonAction: '',
          component: <TagTab tags={tagsResult || []} />,
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
          component: <DocTypeTab docs_types={docTypesResult || []} /> 

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
