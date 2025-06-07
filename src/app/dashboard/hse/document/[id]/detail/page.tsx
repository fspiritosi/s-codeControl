"use client"
import * as React from 'react'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle, Clock, Download, ExternalLink } from "lucide-react"
import { getDocumentById, type Document, type DocumentVersion } from "@/features/Hse/actions/documents"
import { downloadFile } from "@/lib/download"
import { useEffect, useState } from "react"
import { supabaseBrowser } from "@/lib/supabase/browser"
import { fetchAllActivesEmployees } from "@/app/server/GET/actions"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Extendemos el tipo Document para incluir las propiedades adicionales que necesitamos
interface ExtendedDocument extends Document {
  acceptedCount?: number
  totalEmployees?: number
  previousVersions?: DocumentVersion[]
  versions?: DocumentVersion[]
}

// Mock document
// const mockDocument = {
//   id: "1",
//   title: "Manual de Seguridad Vial",
//   version: "2.1",
//   Apartir_De: "2024-01-15",
//   uploadDate: "2024-01-15",
//   expiryDate: "2024-12-31",
//   status: "active",
//   acceptedCount: 45,
//   totalEmployees: 60,
//   fileUrl: "/documents/manual-seguridad.pdf",
//   description:
//     "Este manual contiene las normas y procedimientos de seguridad vial que deben seguir todos los empleados de la empresa.",
//   previousVersions: [
//     { version: "2.0", uploadDate: "2023-10-10", expiryDate: "2024-01-14" },
//     { version: "1.5", uploadDate: "2023-05-15", expiryDate: "2023-10-09" },
//   ],
// }

// Mock employees
const mockEmployees = [
  {
    id: "1",
    name: "Juan Pérez",
    cuil: "20-12345678-9",
    department: "Logística",
    acceptedDate: "2024-01-20",
    status: "accepted",
  },
  {
    id: "2",
    name: "María García",
    cuil: "27-87654321-0",
    department: "Administración",
    acceptedDate: "2024-01-22",
    status: "accepted",
  },
  {
    id: "3",
    name: "Carlos López",
    cuil: "20-11111111-1",
    department: "Operaciones",
    acceptedDate: null,
    status: "accepted",
  },
  {
    id: "4",
    name: "Ana Martínez",
    cuil: "27-22222222-2",
    department: "Logística",
    acceptedDate: "2024-01-25",
    status: "accepted",
  },
  {
    id: "5",
    name: "Roberto Silva",
    cuil: "20-33333333-3",
    department: "Operaciones",
    acceptedDate: null,
    status: "pending",
  },
  {
    id: "6",
    name: "Laura Fernández",
    cuil: "27-44444444-4",
    department: "Administración",
    acceptedDate: "2024-01-23",
    status: "accepted",
  },
  {
    id: "7",
    name: "Miguel Torres",
    cuil: "20-55555555-5",
    department: "Logística",
    acceptedDate: null,
    status: "pending",
  },
  {
    id: "8",
    name: "Sofía Ramírez",
    cuil: "27-66666666-6",
    department: "Operaciones",
    acceptedDate: "2024-01-19",
    status: "accepted",
  },
]

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = supabaseBrowser()
  const [document, setDocument] = useState<ExtendedDocument | null>(null)
  const [activeEmployees, setActiveEmployees] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
  }

  // Cargar documento y empleados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [doc, employees] = await Promise.all([
          getDocumentById(params.id),
          fetchAllActivesEmployees()
        ])
        
        if (!doc) {
          console.error('Documento no encontrado')
          router.push('/dashboard/hse/documents')
          return
        }
        
        setDocument(doc as ExtendedDocument)
        setActiveEmployees(employees || [])
      } catch (error) {
        console.error('Error al cargar los datos:', error)
        toast.error('Error al cargar el documento')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [params.id])
  console.log(document)
  // Ordenar versiones por fecha (más reciente primero)
  const sortedVersions = React.useMemo(() => {
    // Usar versions si está definido, de lo contrario usar un array vacío
    const versions = document?.versions || []
    return [...versions].sort((a, b) => 
      new Date(b.upload_date || b.created_at).getTime() - new Date(a.upload_date || a.created_at).getTime()
    )
  }, [document?.versions])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!document) {
    return <div>Documento no encontrado</div>
  }
  // Usar los empleados reales en lugar de mockEmployees
  const acceptedEmployees = activeEmployees || []
  const pendingEmployees = activeEmployees || [] // Ajustar según la lógica de negocio

  // Verificar si el documento existe
  if (!document) {
    return (
      <div className="p-8">
        <p>Documento no encontrado</p>
      </div>
    )
  }

  const getDocumentUrl = (filePath: string) => {
  if (!filePath) return ''
  const { data } = supabase.storage
    .from('documents-hse') // Asegúrate de que este sea el nombre correcto de tu bucket
    .getPublicUrl(filePath)
  return data.publicUrl
}
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Vigente"
      case "expired":
        return "Vencido"
      case "pending":
        return "Pendiente"
      default:
        return "Desconocido"
    }
  }

  const generateMobileLink = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/mobile/document/${document?.id}`
  }

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
              <Badge className={getStatusColor(document?.status || "")}>{getStatusText(document?.status || "")}</Badge>
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
                navigator.clipboard.writeText(generateMobileLink())
                alert("Link copiado al portapapeles")
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
                    <span>{new Date(document?.upload_date || "").toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de vencimiento:</span>
                    <span>{new Date(document?.expiry_date || "").toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge className={getStatusColor(document?.status || "")}>{getStatusText(document?.status || "")}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versión actual:</span>
                    <span>{document?.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versiones anteriores:</span>
                    <span>{document?.previousVersions?.length || 0}</span>
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
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Lista de Empleados
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Extender Vigencia
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enviar Recordatorios
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Descripción del Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{document?.description}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Empleados que Aceptaron</CardTitle>
                <CardDescription>
                  {acceptedEmployees.length} de {mockEmployees.length} empleados han aceptado este documento
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
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>{employee.acceptedDate}</TableCell>
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
                          <TableCell>{employee.department}</TableCell>
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
                        <TableCell className="font-medium">
                          {document.version} (Actual)
                        </TableCell>
                        <TableCell>
                          {document.upload_date ? format(new Date(document.upload_date), 'PPP', { locale: es }) : '-'}
                        </TableCell>
                        <TableCell>
                          {document.expiry_date ? format(new Date(document.expiry_date), 'PPP', { locale: es }) : 'Sin vencimiento'}
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
                          <TableCell className="font-medium">
                            {version.version}
                          </TableCell>
                          <TableCell>
                            {version.created_at ? format(new Date(version.created_at), 'PPP', { locale: es }) : '-'}
                          </TableCell>
                          <TableCell>Sin vencimiento</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownload(getDocumentUrl(version.file_path), version.file_name)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Descargar
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
        </Tabs>
      </div>
    </div>
  )
}
