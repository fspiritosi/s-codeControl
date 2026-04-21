'use client';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { Progress } from '@/shared/components/ui/progress';
import { getDocumentById, type Document, type DocumentVersion } from '@/modules/hse/features/documents/actions.server';
import cookies from 'js-cookie';
import { Archive, ArrowLeft, Download, ExternalLink, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getAssignedEmployeesByDocumentVersion } from '@/modules/hse/features/documents/actions.server';
import { storage } from '@/shared/lib/storage';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { DataTable, DataTableColumnHeader } from '@/shared/components/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface ExtendedDocument extends Document {
  title: string;
  acceptedCount?: number;
  totalEmployees?: number;
  previousVersions?: DocumentVersion[];
  versions?: DocumentVersion[];
}

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
) => {
  return Array.from(new Set(data?.map(accessor).filter(Boolean))).map((value) => ({
    label: typeof value === 'string' ? value.replaceAll('_', ' ') : value || '',
    value: value || '',
  }));
};

interface DocumentVersionDetailProps {
  id: string;
  version: string;
}

export default function DocumentVersionDetail({ id, version }: DocumentVersionDetailProps) {
  const router = useRouter();
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [document, setDocument] = useState<ExtendedDocument | null>(null);
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const searchParams = useSearchParams();
  const documentId = searchParams.get('documentId');
  const versionId = searchParams.get('versionId');
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
          getDocumentById(id),
        ]);

        if (!doc) {
          console.error('Documento no encontrado');
          router.push('/dashboard/hse/documents');
          return;
        }

        setDocument(doc as ExtendedDocument);
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
  }, [id]);

  const filteredEmployees = activeEmployees.filter((employee) => employee.documentId === id);


  const documentVersion = document?.versions?.find((v) => v.version === version);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!documentVersion) {
    return (
      <div>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-lg font-semibold">Version no encontrada</h1>
          </div>
        </header>
        <div className="container mx-auto py-6">
          <p>La version solicitada no existe.</p>
        </div>
      </div>
    );
  }
  const getDocumentUrl = (filePath: string) => {
    if (!filePath) return '';
    return storage.getPublicUrl('documents-hse', filePath);
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
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Detalle de Version</h1>
            <p className="text-sm text-muted-foreground">
              {documentVersion.title} - Version {documentVersion.version}
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
                  Version Anterior
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Version {documentVersion.version}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleDownload(documentVersion.file_path)}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            {!documentVersion.isCurrent && (
              <Button variant="outline" onClick={() => router.push(`/dashboard/hse/document/${id}/detail`)}>
                Ver Version Actual
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
                  <CardTitle>Informacion de la Version</CardTitle>
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
                    <span className="text-muted-foreground">Version:</span>
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
                  <CardTitle>Estadisticas de Aceptacion</CardTitle>
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
                <CardTitle>Descripcion de la Version</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{documentVersion.description ? documentVersion.description : 'sin descripcion'}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Empleados que Aceptaron esta Version</CardTitle>
                <CardDescription>Historial de aceptaciones para la version {documentVersion.version}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border p-2">
                  <DataTable
                    data={formattedEmployees}
                    columns={getEmployeeColums(handleEdit) as ColumnDef<Record<string, unknown>>[]}
                    tableId="employeeTableVersions"
                    facetedFilters={[
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
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa del Documento - Version {documentVersion.version}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">{documentVersion.title}</p>
                        <p className="text-sm text-muted-foreground">Version {documentVersion.version}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.open(getDocumentUrl(documentVersion.file_path), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir en Nueva Pestana
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
    </div>
  );
}
