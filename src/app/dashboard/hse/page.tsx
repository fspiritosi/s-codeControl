import { fetchAllTags, fetchTrainings } from '@/components/Capacitaciones/actions/actions';
import { TrainingCreateDialog } from '@/components/Capacitaciones/training-create-dialog';
import TrainingSection from '@/components/Capacitaciones/training-section';
import Viewcomponent from '@/components/ViewComponent';
import { DocumentsSection } from '@/features/Hse/components/Document-section';
import { DocumentUploadDialog } from '@/features/Hse/components/Document-upload-dialog';
import { getDocuments, getEmployeesWithAssignedDocuments } from '@/features/Hse/actions/documents';
import { cookies } from 'next/headers';

interface Document {
  id: string;
  title: string;
  version: string;
  upload_date: string;
  expiry_date: string | null;
  status: "active" | "expired" | "pending" |"inactive";
  acceptedCount?: number;
  totalEmployees?: number;
  file_path: string;
  file_name: string;
  file_size: string;
  tags?: string[];
}
async function HSEPage() {
  // Obtener los datos necesarios desde la base de datos
  const cookieStore = cookies();
  const company_id = cookieStore.get('actualComp')?.value;
  
  // Si no hay company_id, redirigir o manejar el error según corresponda
  if (!company_id) {
    throw new Error('No se pudo obtener el ID de la compañía');
  }
  
  const [trainingsResult, tagsResult, documentsResult, employeesResult] = await Promise.all([
    fetchTrainings(),
    fetchAllTags(),
    getDocuments(company_id),
    getEmployeesWithAssignedDocuments()
  ]);
  function normalizeDocument(doc: any): Document {
    return {
      ...doc,
      description: doc.description ?? undefined,
      expiry_date: doc.expiry_date ?? undefined,
      tags: doc.tags ?? [],
      // asegúrate de mapear todos los campos opcionales que puedan ser null
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
          component: <TrainingSection trainings={trainingsResult} allTags={tagsResult} />,
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
          buttonAction: <DocumentUploadDialog />,
          component: <DocumentsSection 
            initialDocuments={documentsResult.map(normalizeDocument)} 
            allTags={tagsResult} 
            initialEmployees={employeesResult} 
          />,
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
