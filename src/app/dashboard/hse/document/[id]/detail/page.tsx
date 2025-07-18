'use client';
import { getCompanyDetails } from '@/app/server/GET/actions';
import { fetchAllTags } from '@/components/Capacitaciones/actions/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getDocumentById,
  getEmployeesWithAssignedDocuments,
  updateDocumentExpiry,
  type Document,
  type DocumentVersion,
} from '@/features/Hse/actions/documents';
import { DocumentNewVersionDialog } from '@/features/Hse/components/Document-new-version-dialog';
import { DocumentUploadDialog } from '@/features/Hse/components/Document-upload-dialog';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { BaseDataTable } from '@/shared/components/data-table/base/data-table';
import { DataTableColumnHeader } from '@/shared/components/data-table/base/data-table-column-header';
import { ColumnDef, VisibilityState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import cookies from 'js-cookie';
import { ArrowLeft, CheckCircle, Clock, Download, Edit, Eye, Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import Cookies from 'js-cookie';
// interface ExtendedDocument extends Document {
//   documentTitle: string;
//   acceptedCount?: number;
//   totalEmployees?: number;
//   previousVersions?: DocumentVersion[];
//   versions?: DocumentVersion[];
// }
interface ExtendedDocument extends Document {
  documentTitle: string;
  docs_types: {
    id: string;
    name: string;
    short_description: string;
  };
  acceptedCount?: number;
  totalEmployees?: number;
  previousVersions?: DocumentVersion[];
  versions?: DocumentVersion[];
  // Agregar estas propiedades
  id: string;
  title: string;
  category?: {
    name: string;
  };
  resource?: {
    name: string;
  };
  documentNumber?: string;
  tags?: string[];
}

interface ProcessedDocument {
  id?: string;
  assignmentId?: string; // Add this line
  status: 'aceptado' | 'pending';
  acceptedAt?: string;
  assignedAt?: string;
  document?: {
    id: string;
    title: string;
    version: string;
    expiryDate: string | null;
  };
}
type LocalProcessedDocument = Omit<ProcessedDocument, 'status'> & {
  status: 'aceptado' | 'pending';
};

interface ProcessedEmployee {
  id: string;
  name: string;
  cuil?: string | null; // Añade | null
  // position: { id: string; name: string } | null;
  position?: {id:string, name:string}|null; // Solo el nombre como string
  email?: string | null; // Añade | null
  documents?: ProcessedDocument[];
}

interface Employee {
  id: string;
  name: string;
  cuil?: string;
  position?: string;
  hierarchical_position?: {
    name: string;
    id: string;
  };
  email?: string;
  company_position?: string;
  documents?: Array<{
    id: string;
    status: 'aceptado' | 'pending';
    acceptedAt?: string;
    assignedAt?: string;
    document?: {
      id: string;
      title: string;
      version: string;
      expiryDate: string | null;
    };
  }>;
}

interface EmployeeWithDocuments extends Employee {}

interface EmployeeTableProp {
  employees: Employee[];
}

interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  is_active: boolean;
}

interface Filter {
  label: string;
  value: string;
}
function getEmployeeColums(
  handleEdit: (employee: EmployeeTableProp['employees'][number]) => void,
  handleSendReminders: (employee: EmployeeTableProp['employees'][number]) => void,
  employeesWithDocuments: Employee[],
  sendingReminderFor: string | null,
  isSendingReminders: boolean,
  setSendingReminderFor: (id: string | null) => void
): ColumnDef<Employee>[] {
  return [
    {
      accessorKey: 'nombre',
      id: 'Nombre',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'cuil',
      id: 'Cuil',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cuil" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'departamento',
      id: 'Departamento',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Departamento" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    // {
    //   accessorKey: 'status',
    //   id: 'Status',
    //   header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    //   filterFn: (row, id, value) => {
    //     return value.includes(row.getValue(id));
    //   },
    // },
    {
      accessorKey: 'status',
      id: 'Status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('Status');

        return (
          <Badge variant={status === 'aceptado' ? 'success' : 'yellow'}>
            {status === 'aceptado' ? 'Aceptado' : 'Pendiente'}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },

    {
      accessorKey: 'actions',
      id: 'Acciones',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Acciones" />,
      cell: ({ row }) => {
        const status = row.getValue('Status');
        const handleSelectArea = () => {
          handleEdit((row.original as any).area_full);
        };
        return status === 'aceptado' ? null : (
          <Button
            size="sm"
            variant="outline"
            className="hover:text-blue-400"
            onClick={async () => {
              const employee = employeesWithDocuments.find((e) => e.id === row.original.id);
              if (employee) {
                setSendingReminderFor(employee.id);
                try {
                  await handleSendReminders(employee);
                } finally {
                  setSendingReminderFor(null);
                }
              }
            }}
            disabled={!!sendingReminderFor || isSendingReminders}
          >
            {sendingReminderFor === row.original.id ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                Enviando...
              </div>
            ) : (
              'Enviar recordatorio'
            )}
          </Button>
        );
      },
    },
  ];
}

const createFilterOptions = <T,>(
  data: T[] | undefined,
  accessor: (item: T) => any,
  icon?: React.ComponentType<{ className?: string }>
) => {
  return Array.from(new Set(data?.map(accessor).filter(Boolean))).map((value) => ({
    label: typeof value === 'string' ? value.replaceAll('_', ' ') : value || '',
    value: value || '',
    icon,
  }));
};

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = supabaseBrowser();
  
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [document, setDocument] = useState<ExtendedDocument | null>(null);
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState<string>('');
  const [savedVisibility, setSavedVisibility] = useState<VisibilityState>({});
  const [mode, setMode] = useState<string>('');
  const [employeesWithDocuments, setEmployeesWithDocuments] = useState<EmployeeWithDocuments[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [sendingReminderFor, setSendingReminderFor] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  // const [savedFilters, setSavedFilters] = useState<Filter[]>([]);
  // const cookies = cookies()
  // const userId = cookies['userId']
  const companyId = Cookies.get('actualComp');

  const names = createFilterOptions<EmployeeWithDocuments>(employeesWithDocuments, (employee) => employee.name);

  const cuils = createFilterOptions<EmployeeWithDocuments>(employeesWithDocuments, (employee) => employee.cuil || '');

  const positions = createFilterOptions<EmployeeWithDocuments>(
    employeesWithDocuments,
    (employee) => employee.position || ''
  );

  const status = createFilterOptions<EmployeeWithDocuments>(
    employeesWithDocuments,
    (employee) => employee.documents?.map((doc) => doc.status).join(', ') || ''
  );

  const formattedEmployees: any = employeesWithDocuments.map((employee) => {
    return {
      ...employee,
      nombre: employee.name,
      cuil: employee.cuil || '',
      departamento: employee.position || '',
      status: employee.documents?.map((document: any) => document.status).join(', ') || '',
    };
  });

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setMode('edit');
  };
  const transformEmployee = (emp: ProcessedEmployee): Employee => ({
    ...emp,
    cuil: emp.cuil || undefined,
    email: emp.email || undefined,
    position: emp.position?.name || undefined,
    documents: emp.documents?.map((doc) => ({
      id: doc.assignmentId || doc.id || '',
      status: doc.status as 'aceptado' | 'pending',
      acceptedAt: doc.acceptedAt,
      assignedAt: doc.assignedAt,
      document: doc.document // Preserve the nested document object
    })) || [],
  });
  useEffect(() => {
    const fetchEmployeesWithDocuments = async () => {
      try {
        const { data, error } = (await getEmployeesWithAssignedDocuments(companyId as string, params.id)) as {
          data: ProcessedEmployee[] | null;
          error: Error | null;
        };
        if (error) throw error;
        
        // Usa la función de transformación
        const transformedData = data?.map(transformEmployee) || [];

        setEmployeesWithDocuments(transformedData);
      } catch (error) {
        console.error('Error al obtener empleados con documentos:', error);
        toast.error('Error al cargar los empleados');
      }
    };
    const fetchCompany = async () => {
      if (companyId) {
        const companyData = await getCompanyDetails(companyId);
        setCompany(companyData as any);
      }
    };
    fetchCompany();
    fetchEmployeesWithDocuments();
  }, [params.id]);
  // Función para manejar la descarga de archivos
  // Función para manejar la descarga de archivos

  const handleDownload = (fileUrl: string, fileName: string) => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      // Usar window.document para evitar conflictos con la interfaz Document
      const doc = window.document;
      const link = doc.createElement('a');
      link.href = fileUrl;
      link.download = fileName; // Siempre forzar la descarga

      doc.body.appendChild(link);
      link.click();
      doc.body.removeChild(link);

      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      toast.error('Error al descargar el archivo');
    } finally {
      setIsDownloading(false);
    }
  };

  // Cargar tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await fetchAllTags();
        setAllTags(tags as Tag[]);
      } catch (error) {
        console.error('Error al cargar las etiquetas:', error);
      }
    };

    fetchTags();
  }, []);
  

  // Obtener el color de un tag basado en su nombre
  const getTagColor = (tagName: string) => {
    if (!allTags || allTags.length === 0) return { backgroundColor: '#f3f4f6', color: '#1f2937' }; // gris por defecto

    const tag = allTags.find((t) => t.name === tagName);
    if (!tag || !tag.color) return { backgroundColor: '#f3f4f6', color: '#1f2937' }; // gris por defecto

    // Calcular el color de texto para mejor contraste (blanco o negro)
    const hex = tag.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const textColor = brightness > 128 ? '#1f2937' : '#ffffff'; // Negro para fondos claros, blanco para fondos oscuros

    return {
      backgroundColor: tag.color,
      color: textColor,
      border: 'none',
    };
  };

  // Cargar documento y empleados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [doc, employees] = await Promise.all([
          getDocumentById(params.id),
          getEmployeesWithAssignedDocuments(params.id),
        ]);
        

        if (!doc) {
          console.error('Documento no encontrado');
          router.push('/dashboard/hse/documents');
          return;
        }

        setDocument(doc as ExtendedDocument);
        setActiveEmployees((employees as any) || []);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
        toast.error('Error al cargar el documento');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  // Ordenar versiones por fecha (más reciente primero)
  const sortedVersions = React.useMemo(() => {
    // Usar versions si está definido, de lo contrario usar un array vacío
    const versions = document?.versions || [];
    return [...versions].sort(
      (a, b) => new Date(b.upload_date || b.created_at).getTime() - new Date(a.upload_date || a.created_at).getTime()
    );
  }, [document?.versions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!document) {
    return <div>Documento no encontrado</div>;
  }
  // Usar los empleados reales en lugar de mockEmployees
  const acceptedEmployees = employeesWithDocuments.filter((employee) =>
    employee.documents?.some((doc: ProcessedDocument) => doc.status === 'aceptado')
  );

  const pendingEmployees = employeesWithDocuments.filter((employee) =>
    employee.documents?.some((doc: ProcessedDocument) => doc.status === 'pending')
  );

  // Verificar si el documento existe
  if (!document) {
    return (
      <div className="p-8">
        <p>Documento no encontrado</p>
      </div>
    );
  }

  const getDocumentUrl = (filePath: string) => {
    if (!filePath) return '';
    const { data } = supabase.storage
      .from('documents-hse') // Asegúrate de que este sea el nombre correcto de tu bucket
      .getPublicUrl(filePath);
    return data.publicUrl;
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Vigente';
      case 'expired':
        return 'Vencido';
      case 'pending':
        return 'Pendiente';
      case 'borrador':
        return 'Borrador';
      default:
        return 'Desconocido';
    }
  };

  const generateMobileLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/mobile/document/${document?.id}`;
  };

  const handleExtendExpiry = async () => {
    if (!document?.id || !newExpiryDate) return;

    try {
      await updateDocumentExpiry(document.id, newExpiryDate);

      // Actualizar el documento localmente
      setDocument((prev) =>
        prev
          ? {
              ...prev,
              expiry_date: newExpiryDate,
            }
          : null
      );

      setShowExtendDialog(false);
      toast.success('Vigencia extendida correctamente');
    } catch (error) {
      console.error('Error al extender la vigencia:', error);
      toast.error('Error al extender la vigencia');
    }
    router.push(`/dashboard/hse`);
  };

  const sendReminder = async (employee: Employee) => {
    try {
      const documentUrl = `${window.location.origin}/dashboard/hse/document/${document.id}/detail`;

      // Crear el cuerpo del correo usando el template
      const emailBody = {
        recurso: document.category?.name || 'Documento',
        document_name: document.title,
        company_name: company?.company_name || 'Empresa',
        resource_name: employee.name, // Usar el nombre del empleado
        document_number: document.documentNumber || 'N/A',
        companyConfig: {
          name: company?.company_name || 'Empresa',
          logo: company?.company_logo || 'https://via.placeholder.com/200x60/667eea/ffffff?text=LOGO',
          website: company?.website || 'https://tuempresa.com',
          supportEmail: company?.contact_email || 'soporte@tuempresa.com',
          primaryColor: '#667eea',
          secondaryColor: '#764ba2',
        },
      };

      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: employee.email,
          subject: `Recordatorio: ${document.title} pendiente de revisión`,
          userEmail: employee.email,
          react: 'document',
          body: emailBody,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      return { success: true, email: employee.email };
    } catch (error) {
      console.error(`Error enviando a ${employee.email}:`, error);
      return { success: false, email: employee.email, error };
    }
  };

  const handleSendReminders = async (employeeToNotify: Employee | null = null) => {
    if (!document) return;

    try {
      setIsSendingReminders(true);

      const employees = employeeToNotify ? [employeeToNotify] : pendingEmployees;

      if (employees.length === 0) {
        toast.info('No hay empleados pendientes para notificar');
        return;
      }

      const results = await Promise.all(employees.map(sendReminder));

      const successful = results.filter((r) => r.success).length;
      const failed = results.length - successful;

      if (employeeToNotify) {
        // Modo individual
        const msg = successful
          ? `Recordatorio enviado a ${employeeToNotify.name}`
          : `Error al enviar a ${employeeToNotify.name}`;
        successful ? toast.success(msg) : toast.error(msg);
      } else {
        // Modo masivo
        toast.success(`Recordatorios enviados: ${successful} exitosos, ${failed} fallidos`);
      }
    } catch (error) {
      console.error('Error al enviar recordatorios:', error);
      toast.error('Error al enviar los recordatorios');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const exportToExcel = () => {
    try {
      if (!document || !employeesWithDocuments.length) {
        toast.info('No hay empleados para exportar');
        return;
      }

      // Función para formatear fechas
      const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Pendiente';
        try {
          return new Date(dateString).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch (e) {
          return dateString; // En caso de error, devolver el string original
        }
      };

      // Crear datos para el Excel
      const data = employeesWithDocuments.map((employee: any) => {
        // Encontrar la asignación del documento actual para este empleado
        const docAssignment = employee.documents.find((doc: any) => doc.document.id === document.id);

        return {
          Cuil: employee.cuil || 'N/A',
          Nombre: employee.name,
          Email: employee.email,
          Puesto: employee.position || 'N/A',
          Estado: docAssignment?.status === 'accepted' ? 'Aceptado' : 'Pendiente',
          'Fecha de Asignación': formatDate(docAssignment?.assignedAt),
          'Fecha de Aceptación': docAssignment?.acceptedAt ? formatDate(docAssignment.acceptedAt) : 'Pendiente',
          'Fecha de Vencimiento': document.expiry_date ? formatDate(document.expiry_date) : 'Sin fecha',
        };
      });

      // Ordenar por estado (primero los pendientes)
      data.sort((a, b) => {
        if (a.Estado === 'Pendiente' && b.Estado !== 'Pendiente') return -1;
        if (a.Estado !== 'Pendiente' && b.Estado === 'Pendiente') return 1;
        return 0;
      });

      // Crear un libro de trabajo y una hoja
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();

      // Ajustar el ancho de las columnas
      const wscols = [
        { wch: 15 }, // Legajo
        { wch: 25 }, // Nombre
        { wch: 30 }, // Email
        { wch: 20 }, // Puesto
        { wch: 15 }, // Estado
        { wch: 25 }, // Fecha Asignación
        { wch: 25 }, // Fecha Aceptación
        { wch: 25 }, // Fecha Vencimiento
      ];
      ws['!cols'] = wscols;

      // Agregar encabezados con estilo
      const headerStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'D9D9D9' } },
      };

      // Aplicar estilo a la primera fila (encabezados)
      if (!ws['!rows']) ws['!rows'] = [];
      ws['!rows'][0] = { ...ws['!rows'][0] };

      XLSX.utils.book_append_sheet(wb, ws, 'Empleados');

      // Generar el nombre del archivo
      const fileName = `Documento_${document.title}_Empleados_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Guardar el archivo
      XLSX.writeFile(wb, fileName);

      toast.success('Lista de empleados exportada correctamente');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast.error('Error al exportar la lista de empleados');
    }
  };

  const getDocumentAssignedPositions = (documentId: string): string[] => {
    if (!employeesWithDocuments || !Array.isArray(employeesWithDocuments)) {
      return [];
    }
  
    const positionSet = new Set<string>();
  
    employeesWithDocuments.forEach((employee) => {
      const hasDocument = employee.documents?.some(doc => 
        doc.document?.id === documentId || doc.id === documentId
      );
  
      if (hasDocument) {
        if (employee.hierarchical_position && typeof employee.hierarchical_position === 'object') {
          positionSet.add(employee.company_position || employee.hierarchical_position.name);
        } else if (employee.position && typeof employee.position === 'string') {
          positionSet.add(employee.position);
        }
      }
    });
  
    return Array.from(positionSet);
  };

  return (
    <div className="space-y-6 w-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <div>
          <h1 className="text-lg font-semibold">Detalle de Documento</h1>
          <p className="text-sm text-muted-foreground">{document?.docs_types?.short_description} - {document?.title}</p>
        </div>
      </header>

      {/* Edit Document Dialog */}
      {document && (
        <DocumentUploadDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          mode="edit"
          allTags={allTags}
          initialData={{
            id: document.id,
            docs_types: document.docs_types?.id,
            title: document.title,
            version: document.version,
            description: document.description || '',
            expiry_date: document.expiry_date || undefined,
            file_path: document.file_path,
            file_name: document.file_name,
            file_type: document.file_type,
            file_size: document.file_size,
            typeOfEmployee:getDocumentAssignedPositions(document?.id),
            tags: document.tags,
          }}
          documentId={document.id}
        />
      )}

      <div className="w-full pl-6 pr-4 py-6 space-y-8">
        {/* Document Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{document?.docs_types?.short_description} - {document?.title}</h1>
              <Badge className={getStatusColor(document?.status || '')}>{getStatusText(document?.status || '')}</Badge>
            </div>
            <p className="text-muted-foreground">Versión {document?.version}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* <Button variant="outline" onClick={() => handleDownload(document.file_path, document.file_name)}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button> */}
            {/* <Button
              onClick={() => {
                navigator.clipboard.writeText(generateMobileLink());
                alert('Link copiado al portapapeles');
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Copiar Link Móvil
            </Button> */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              disabled={document?.status === 'active'}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Documento
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="employees">Empleados</TabsTrigger>
            <TabsTrigger value="preview">Vista Previa</TabsTrigger>
            <TabsTrigger value="versions">Versiones</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex flex-wrap gap-2">
                      {document?.tags?.map((tag) => (
                        <Badge key={tag} className="px-2 py-1 text-sm" style={getTagColor(tag)}>
                          {tag}
                        </Badge>
                      ))}
                    </div>

                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo de documento:</span>
                    <span>{document?.docs_types?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de subida:</span>
                    <span>{new Date(document?.upload_date || '').toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de vto:</span>
                    <span>
                      {document?.expiry_date
                        ? new Date(document?.expiry_date || '').toLocaleDateString()
                        : 'sin vencimiento'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge className={getStatusColor(document?.status || '')}>
                      {getStatusText(document?.status || '')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versión actual:</span>
                    <span>{document?.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versiones anteriores:</span>
                    <span>{document?.versions?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progreso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {acceptedEmployees.length}/{acceptedEmployees.length + pendingEmployees.length}
                    </div>
                    <p className="text-muted-foreground">Empleados aceptaron</p>
                  </div>
                  <Progress
                    value={(acceptedEmployees.length / (acceptedEmployees.length + pendingEmployees.length)) * 100}
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span>{acceptedEmployees.length} aceptado</span>
                    <span>{pendingEmployees.length} pendientes</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start truncate"
                    onClick={exportToExcel}
                    disabled={!employeesWithDocuments.length}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Lista de Empleados
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start truncate"
                    onClick={() => {
                      setNewExpiryDate(document?.expiry_date || '');
                      setShowExtendDialog(true);
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Extender Vigencia
                  </Button>
                  {document?.status !== 'expired' && (
                    <Button
                      variant="outline"
                      className="w-full justify-start truncate"
                      onClick={() => handleSendReminders(null)}
                      disabled={isSendingReminders}
                    >
                      {isSendingReminders ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Enviar Recordatorios
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start truncate"
                    onClick={() => setShowNewVersionDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Nueva Versión
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Descripción del Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{document?.description ? document?.description : 'sin descripción'}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Empleados</CardTitle>
                <CardDescription>
                  {acceptedEmployees.length} de {employeesWithDocuments.length} empleados han aceptado este documento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border p-2">
                  <BaseDataTable
                    data={formattedEmployees}
                    columns={getEmployeeColums(
                      handleEdit,
                      handleSendReminders,
                      employeesWithDocuments,
                      sendingReminderFor,
                      isSendingReminders,
                      setSendingReminderFor
                    )}
                    savedVisibility={savedVisibility}
                    tableId="employeeTable"
                    toolbarOptions={{
                      initialVisibleFilters: [],
                      filterableColumns: [
                        {
                          columnId: 'Nombre',
                          title: 'Nombre',
                          options: names,
                        },
                        {
                          columnId: 'Cuil',
                          title: 'Cuil',
                          options: cuils,
                        },
                        {
                          columnId: 'Departamento',
                          title: 'Departamento',
                          options: positions,
                        },
                        {
                          columnId: 'Status',
                          title: 'Status',
                          options: status,
                        },
                      ],
                    }}
                  />
                  {/* <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>CUIL</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Fecha de Aceptación</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {acceptedEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.cuil}</TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell>
                            {employee.documents && employee.documents.length > 0
                              ? format(new Date(employee.documents[0].acceptedAt), 'PPP', { locale: es })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Aceptado</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table> */}
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle>Empleados Pendientes</CardTitle>
                <CardDescription>
                  {pendingEmployees.length} empleados aún no han aceptado este documento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>CUIL</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.cuil}</TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Enviar Recordatorio
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card> */}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa del Documento</CardTitle>
              </CardHeader>
              <CardContent>
                {document?.file_path ? (
                  <iframe
                    src={getDocumentUrl(document.file_path)}
                    className="w-full h-[600px] border rounded"
                    title={document?.title}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded">
                    <p className="text-gray-500">No hay vista previa disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Versiones</CardTitle>
                <CardDescription>Versiones anteriores del documento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Versión</TableHead>
                        <TableHead>Fecha de Subida</TableHead>
                        <TableHead>Fecha de Vencimiento</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Versión actual */}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-medium">{document.version} (Actual)</TableCell>
                        <TableCell>
                          {document.upload_date ? format(new Date(document.upload_date), 'PPP', { locale: es }) : '-'}
                        </TableCell>
                        <TableCell>
                          {document.expiry_date
                            ? format(new Date(document.expiry_date), 'PPP', { locale: es })
                            : 'Sin vencimiento'}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(document.file_path, document.file_name)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Versiones anteriores */}
                      {document.versions?.map((version, index) => (
                        <TableRow key={version.id || index}>
                          <TableCell className="font-medium">{version.version}</TableCell>
                          <TableCell>
                            {version.created_at ? format(new Date(version.created_at), 'PPP', { locale: es }) : '-'}
                          </TableCell>
                          <TableCell>
                            {version.expiry_date
                              ? format(new Date(version.expiry_date), 'PPP', { locale: es })
                              : 'Sin vencimiento'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(version.file_path, version.file_name)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Descargar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Buscar la versión específica en el array de versiones
                                  const versionData = document.versions?.find((v) => v.version === version.version);

                                  // Opción 1: Usar template strings para la URL
                                  router.push(
                                    `/dashboard/hse/document/${document.id}/detail/version/${version.version}/detail?documentId=${document.id}&versionId=${versionData?.id}`
                                  );

                                  // O también puedes usar el objeto con pathname y query (importa useRouter de 'next/router')
                                  // router.push({
                                  //   pathname: `/dashboard/hse/document/${document.id}/detail/version/${version.version}/detail`,
                                  //   query: {
                                  //     documentId: document.id,
                                  //     versionId: versionData?.id
                                  //   }
                                  // });
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Detalle
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <DocumentNewVersionDialog
        open={showNewVersionDialog}
        document={document as any}
        companyId={companyId || ''}
        onOpenChange={setShowNewVersionDialog}
        documentTitle={document?.title}
        currentVersion={document?.version}
        onVersionCreated={(newVersion) => {
          // Aquí actualizarías el documento con la nueva versión
          setShowNewVersionDialog(false);
        }}
      />
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extender Vigencia del Documento</DialogTitle>
            <DialogDescription>Selecciona la nueva fecha de vencimiento para este documento.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Nueva Fecha de Vencimiento</Label>
              <Input
                id="expiryDate"
                type="date"
                value={newExpiryDate ? newExpiryDate.split('T')[0] : ''}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} // No permitir fechas anteriores a hoy
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExtendExpiry} disabled={!newExpiryDate}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
