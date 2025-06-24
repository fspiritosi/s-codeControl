'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
// import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
// import { Separator } from "@/components/ui/separator"
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDocumentById, type Document, type DocumentVersion } from '@/features/Hse/actions/documents';
import cookies from 'js-cookie';
import { Archive, ArrowLeft, Download, ExternalLink, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
// import { DocumentNewVersionDialog } from "@/features/Hse/components/Document-new-version-dialog"
import { getAssignedEmployeesByDocumentVersion } from '@/features/Hse/actions/documents';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { BaseDataTable } from '@/shared/components/data-table/base/data-table';
import { DataTableColumnHeader } from '@/shared/components/data-table/base/data-table-column-header';
import { ColumnDef } from '@tanstack/react-table';
import { VisibilityState } from '@tanstack/react-table';

interface ExtendedDocument extends Document {
  title: string;
  acceptedCount?: number;
  totalEmployees?: number;
  previousVersions?: DocumentVersion[];
  versions?: DocumentVersion[];
}

interface EmployeeWithDocuments extends Employee {}
 
interface EmployeeTableProp {
  employees: Employee[];
}

interface ActiveEmployee {
  employee: Employee;
  accepted_at: string;
  hierarchical_position: string;
  status: string;
}

function getEmployeeColums(
  handleEdit: (employee: ActiveEmployee) => void
): ColumnDef<ActiveEmployee>[] {
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
    {
      accessorKey: 'accepted_at',
      id: 'Fecha de aceptación',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha de Aceptación" />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },    
    {
      accessorKey: 'status',
      id: 'Status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('Status');
        
        return (
          <Badge variant={status === 'accepted' ? 'success' : 'yellow'}>
            {status === 'accepted' ? 'Aceptado' : 'Pendiente'}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
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

export default function DocumentVersionDetailPage({ params }: { params: { id: string; version: string } }) {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [document, setDocument] = useState<ExtendedDocument | null>(null);
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [savedVisibility, setSavedVisibility] = useState<VisibilityState>({});

  const searchParams = useSearchParams();
  const documentId = searchParams.get('documentId');
  const versionId = searchParams.get('versionId');
  //   const userId = cookies['userId']
  const companyId = cookies.get('actualComp');

  const names = createFilterOptions<ActiveEmployee>(
      activeEmployees, 
      (employee) => employee.employee.lastname + ' ' + employee.employee.firstname
    );
    
    const cuils = createFilterOptions<ActiveEmployee>(
      activeEmployees, 
      (employee) => employee.employee.cuil || ''
    );
    
    const positions = createFilterOptions<ActiveEmployee>(
      activeEmployees, 
      (employee) => employee.employee.hierarchical_position || ''
    );
    
    const status = createFilterOptions<ActiveEmployee>(
      activeEmployees, 
      (employee) => employee.status
    );
    
    const formattedEmployees: any = activeEmployees.map((employee) => {
      return {
        nombre: employee.employee.lastname + ' ' + employee.employee.firstname,
        cuil: employee.employee.cuil || '',
        departamento: employee.employee. hierarchical_position.name || '',
        accepted_at: employee.accepted_at ? format(new Date(employee.accepted_at), 'dd/MM/yyyy HH:mm') : '-',
        status: employee.status
      };
    });

    const handleEdit = (employee: any) => {
      setSelectedEmployee(employee);
      
    };
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [doc] = await Promise.all([
          getDocumentById(params.id),
          // fetchAllActivesEmployees()
        ]);

        if (!doc) {
          console.error('Documento no encontrado');
          router.push('/dashboard/hse/documents');
          return;
        }

        setDocument(doc as ExtendedDocument);
        // setActiveEmployees(employees || [])
      } catch (error) {
        console.error('Error al cargar los datos:', error);
        toast.error('Error al cargar el documento');
      } finally {
        setIsLoading(false);
      }
    };
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const [employees] = await Promise.all([getAssignedEmployeesByDocumentVersion(versionId || '')]);

        if (!employees) {
          console.error('Empleados no encontrados');
          return;
        }

        setActiveEmployees(employees || []);
      } catch (error) {
        console.error('Error al cargar los empleados:', error);
        toast.error('Error al cargar los empleados');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    fetchEmployees();
  }, [params.id]);
  
  const filteredEmployees = activeEmployees.filter((employee) => employee.documentId === params.id);
  

  // Obtener la versión específica del documento
  // const documentVersion = mockDocumentVersions[params.id as keyof typeof mockDocumentVersions]?.[params.version]
  const documentVersion = document?.versions?.find((version) => version.version === params.version);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!documentVersion) {
    return (
      //   <SidebarInset>
      <div>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          {/* <SidebarTrigger className="-ml-1" /> */}
          {/* <Separator orientation="vertical" className="mr-2 h-4" /> */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-lg font-semibold">Versión no encontrada</h1>
          </div>
        </header>
        <div className="container mx-auto py-6">
          <p>La versión solicitada no existe.</p>
        </div>
      </div>
      //   </SidebarInset>
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
      default:
        return 'Desconocido';
    }
  };
  const handleDownload = (fileUrl: string) => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const doc = window.document;
      const link = doc.createElement('a');
      link.href = fileUrl;
      link.download = documentVersion.title;
      doc.body.appendChild(link);
      link.click();
      doc.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      toast.error('Error al descargar el archivo');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    // <SidebarInset>
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        {/* <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" /> */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Detalle de Versión</h1>
            <p className="text-sm text-muted-foreground">
              {documentVersion.title} - Versión {documentVersion.version}
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-6 space-y-8">
        {/* Document Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{documentVersion.title}</h1>
              <Badge className={getStatusColor(documentVersion.status)}>{getStatusText(documentVersion.status)}</Badge>
              {!documentVersion.isCurrent && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Archive className="h-3 w-3" />
                  Versión Anterior
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Versión {documentVersion.version}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleDownload(documentVersion.file_path)}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            {!documentVersion.isCurrent && (
              <Button variant="outline" onClick={() => router.push(`/dashboard/hse/document/${params.id}/detail`)}>
                Ver Versión Actual
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="employees">Empleados</TabsTrigger>
            <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Versión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de subida:</span>
                    <span>{new Date(documentVersion.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de vto:</span>
                    <span>
                      {documentVersion.expiry_date
                        ? new Date(documentVersion.expiry_date).toLocaleDateString()
                        : 'sin vencimiento'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge className={getStatusColor(documentVersion.status)}>
                      {getStatusText(documentVersion.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versión:</span>
                    <span>{documentVersion.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>{documentVersion.isCurrent ? 'Actual' : 'Anterior'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Aceptación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {activeEmployees.filter((employee) => employee.status === 'accepted').length}/
                      {activeEmployees.length}
                    </div>
                    <p className="text-muted-foreground">Empleados aceptaron</p>
                  </div>
                  <Progress
                    value={
                      ((activeEmployees.filter((employee) => employee.status === 'accepted').length || 0) /
                        (activeEmployees.length || 0)) *
                      100
                    }
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span>
                      {Math.round(
                        ((activeEmployees.filter((employee) => employee.status === 'accepted').length || 0) /
                          (activeEmployees.length || 0)) *
                          100
                      )}
                      % aceptado
                    </span>
                    <span>
                      {(activeEmployees.length ?? 0) -
                        (activeEmployees.filter((employee) => employee.status === 'accepted').length ?? 0)}{' '}
                      empleados no aceptaron
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Descripción de la Versión</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{documentVersion.description ? documentVersion.description : 'sin descripción'}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Empleados que Aceptaron esta Versión</CardTitle>
                <CardDescription>Historial de aceptaciones para la versión {documentVersion.version}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border p-2">
                  <BaseDataTable
                    data={formattedEmployees}
                    columns={getEmployeeColums(handleEdit)}
                    savedVisibility={savedVisibility}
                    tableId="employeeTableVersions"
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
                      {activeEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.employee.firstname + ' ' + employee.employee.lastname}
                          </TableCell>
                          <TableCell>{employee.employee.cuil}</TableCell>
                          <TableCell>{employee.employee.hierarchical_position.name}</TableCell>
                          <TableCell>
                            {employee.accepted_at ? format(new Date(employee.accepted_at), 'dd/MM/yyyy HH:mm') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                employee.status === 'accepted'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {employee.status === 'accepted' ? 'Aceptado' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table> */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa del Documento - Versión {documentVersion.version}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">{documentVersion.title}</p>
                        <p className="text-sm text-muted-foreground">Versión {documentVersion.version}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.open(getDocumentUrl(documentVersion.file_path), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir en Nueva Pestaña
                    </Button>
                  </div>

                  <iframe
                    src={getDocumentUrl(documentVersion.file_path)}
                    className="w-full h-[600px] border rounded"
                    title={documentVersion.title}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* <DocumentNewVersionDialog
        open={showNewVersionDialog}
        onOpenChange={setShowNewVersionDialog}
        documentTitle={document.title}
        currentVersion={documentVersion.version}
        onVersionCreated={(newVersion:any) => {
          // Aquí actualizarías el documento con la nueva versión
          console.log("Nueva versión creada:", newVersion)
          setShowNewVersionDialog(false)
        }}
        companyId={companyId}
        // userId={userId}
        document={document}
      /> */}
    </div>
    // </SidebarInset>
  );
}
