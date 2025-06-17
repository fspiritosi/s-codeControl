'use client';
import { fetchAllActivesEmployees } from '@/app/server/GET/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDocumentById, type Document, type DocumentVersion } from '@/features/Hse/actions/documents';
import { DocumentNewVersionDialog } from '@/features/Hse/components/Document-new-version-dialog';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import cookies from 'js-cookie';
import { ArrowLeft, CheckCircle, Clock, Download, ExternalLink, Plus, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {getEmployeesWithAssignedDocuments, updateDocumentExpiry} from '@/features/Hse/actions/documents';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
// Extendemos el tipo Document para incluir las propiedades adicionales que necesitamos
interface ExtendedDocument extends Document {
  documentTitle: string;
  acceptedCount?: number;
  totalEmployees?: number;
  previousVersions?: DocumentVersion[];
  versions?: DocumentVersion[];
}



export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [document, setDocument] = useState<ExtendedDocument | null>(null);
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
const [newExpiryDate, setNewExpiryDate] = useState<string>('');
  // const cookies = cookies()
  // const userId = cookies['userId']
  const companyId = cookies.get('actualComp');

  const [employeesWithDocuments, setEmployeesWithDocuments] = useState<any[]>([]);
  useEffect(() => {
    const fetchEmployeesWithDocuments = async () => {
      try {
        const { data, error } = await getEmployeesWithAssignedDocuments(params.id);
        if (error) throw error;
        setEmployeesWithDocuments(data || []);
      } catch (error) {
        console.error('Error al obtener empleados con documentos:', error);
        toast.error('Error al cargar los empleados');
      }
    };
  
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

  // Cargar documento y empleados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [doc, employees] = await Promise.all([getDocumentById(params.id), getEmployeesWithAssignedDocuments(params.id)]);

        if (!doc) {
          console.error('Documento no encontrado');
          router.push('/dashboard/hse/documents');
          return;
        }

        setDocument(doc as ExtendedDocument);
        setActiveEmployees(employees as any || []);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
        toast.error('Error al cargar el documento');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);
  console.log(document);
  console.log(employeesWithDocuments);
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
    </div>)
    
  }

  if (!document) {
    return <div>Documento no encontrado</div>;
  }
  // Usar los empleados reales en lugar de mockEmployees
  const acceptedEmployees = employeesWithDocuments.filter(employee => 
    employee.documents.some((doc: any) => doc.status === 'accepted')
  );
  
  const pendingEmployees = employeesWithDocuments.filter(employee => 
    employee.documents.some((doc: any) => doc.status === 'pending')
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
      setDocument(prev => prev ? { 
        ...prev, 
        expiry_date: newExpiryDate 
      } : null);
      
      setShowExtendDialog(false);
      toast.success('Vigencia extendida correctamente');
    } catch (error) {
      console.error('Error al extender la vigencia:', error);
      toast.error('Error al extender la vigencia');
    }
  };

  const handleSendReminders = async () => {
    if (!document) return;
  
    try {
      setIsSendingReminders(true);
      
      // 1. Obtener empleados pendientes
      
  
      if (pendingEmployees.length === 0) {
        toast.info('No hay empleados pendientes para notificar');
        return;
      }
  
      // 2. Enviar recordatorios
      const results = await Promise.all(
        pendingEmployees.map(async (employee) => {
          try {
            const documentUrl = `${window.location.origin}/dashboard/documents/${document.id}`;
            const message = `
              Hola ${employee.name},
              
              Tienes pendiente de revisión el documento "${document.title}".
              
              Por favor, accede a la plataforma para revisarlo y aceptarlo.
              
              <a href="${documentUrl}" style="
                display: inline-block;
                padding: 10px 20px;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 10px 0;
              ">Ver Documento</a>
              
              Gracias,
              El equipo de Recursos Humanos
            `;
  
            const response = await fetch('/api/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: employee.email,
                subject: `Recordatorio: ${document.title} pendiente de revisión`,
                userEmail: employee.email,
                react: 'recordatorio_documento',
                body: message
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
        })
      );
  
      // 3. Mostrar resultados
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
  
      toast.success(
        `Recordatorios enviados: ${successful} exitosos, ${failed} fallidos`
      );
  
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
            minute: '2-digit'
          });
        } catch (e) {
          return dateString; // En caso de error, devolver el string original
        }
      };
  
      // Crear datos para el Excel
      const data = employeesWithDocuments.map(employee => {
        // Encontrar la asignación del documento actual para este empleado
        const docAssignment = employee.documents.find(doc => 
          doc.document.id === document.id
        );
  
        return {
          'Cuil': employee.cuil || 'N/A',
          'Nombre': employee.name,
          'Email': employee.email,
          'Puesto': employee.position || 'N/A',
          'Estado': docAssignment?.status === 'accepted' ? 'Aceptado' : 'Pendiente',
          'Fecha de Asignación': formatDate(docAssignment?.assignedAt),
          'Fecha de Aceptación': docAssignment?.acceptedAt 
            ? formatDate(docAssignment.acceptedAt)
            : 'Pendiente',
          'Fecha de Vencimiento': document.expiry_date 
            ? formatDate(document.expiry_date)
            : 'Sin fecha'
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
        fill: { fgColor: { rgb: "D9D9D9" } }
      };
      
      // Aplicar estilo a la primera fila (encabezados)
      if (!ws['!rows']) ws['!rows'] = [];
      ws['!rows'][0] = { ...ws['!rows'][0], style: headerStyle };
  
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

  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Detalle de Documento</h1>
            <p className="text-sm text-muted-foreground">{document?.title}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-6 space-y-8">
        {/* Document Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{document?.title}</h1>
              <Badge className={getStatusColor(document?.status || '')}>{getStatusText(document?.status || '')}</Badge>
            </div>
            <p className="text-muted-foreground">Versión {document?.version}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleDownload(document.file_path, document.file_name)}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(generateMobileLink());
                alert('Link copiado al portapapeles');
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Copiar Link Móvil
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
                    <span className="text-muted-foreground">Fecha de subida:</span>
                    <span>{new Date(document?.upload_date || '').toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de vto:</span>
                    <span>{document?.expiry_date ? new Date(document?.expiry_date || '').toLocaleDateString() : "sin vencimiento"}</span>
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
  className="w-full justify-start"
  onClick={exportToExcel}
  disabled={!employeesWithDocuments.length}
>
  <Download className="h-4 w-4 mr-2" />
  Exportar Lista de Empleados
</Button>
                  <Button variant="outline" className="w-full justify-start"onClick={() => {
    setNewExpiryDate(document?.expiry_date || '');
    setShowExtendDialog(true);
  }}>
                    <Clock className="h-4 w-4 mr-2" />
                    Extender Vigencia
                  </Button>
                  <Button 
  variant="outline" 
  className="w-full justify-start"
  onClick={handleSendReminders}
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
                  <Button
                    variant="outline"
                    className="w-full justify-start"
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
                <p>{document?.description ? document?.description : "sin descripción"}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Empleados que Aceptaron</CardTitle>
                <CardDescription>
                  {acceptedEmployees.length} de {employeesWithDocuments.length} empleados han aceptado este documento
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
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
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
            </Card>
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
    const versionData = document.versions?.find(v => v.version === version.version);
    
    // Opción 1: Usar template strings para la URL
    router.push(`/dashboard/hse/document/${document.id}/detail/version/${version.version}/detail?documentId=${document.id}&versionId=${versionData?.id}`);
    
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
          console.log('Nueva versión creada:', newVersion);
          setShowNewVersionDialog(false);
        }}
        
      />
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Extender Vigencia del Documento</DialogTitle>
      <DialogDescription>
        Selecciona la nueva fecha de vencimiento para este documento.
      </DialogDescription>
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
      <Button 
        variant="outline" 
        onClick={() => setShowExtendDialog(false)}
      >
        Cancelar
      </Button>
      <Button 
        onClick={handleExtendExpiry}
        disabled={!newExpiryDate}
      >
        Guardar Cambios
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}
