"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle, Clock, Download, ExternalLink } from "lucide-react"

// Mock document
const mockDocument = {
  id: "1",
  title: "Manual de Seguridad Vial",
  version: "2.1",
  Apartir_De: "2024-01-15",
  uploadDate: "2024-01-15",
  expiryDate: "2024-12-31",
  status: "active",
  acceptedCount: 45,
  totalEmployees: 60,
  fileUrl: "/documents/manual-seguridad.pdf",
  description:
    "Este manual contiene las normas y procedimientos de seguridad vial que deben seguir todos los empleados de la empresa.",
  previousVersions: [
    { version: "2.0", uploadDate: "2023-10-10", expiryDate: "2024-01-14" },
    { version: "1.5", uploadDate: "2023-05-15", expiryDate: "2023-10-09" },
  ],
}

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
    status: "pending",
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
console.log(params)
  // Filter employees by status
  const acceptedEmployees = mockEmployees.filter((emp) => emp.status === "accepted")
  const pendingEmployees = mockEmployees.filter((emp) => emp.status === "pending")

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
    return `${baseUrl}/mobile/document/${mockDocument.id}`
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
            <p className="text-sm text-muted-foreground">{mockDocument.title}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-6 space-y-8">
        {/* Document Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{mockDocument.title}</h1>
              <Badge className={getStatusColor(mockDocument.status)}>{getStatusText(mockDocument.status)}</Badge>
            </div>
            <p className="text-muted-foreground">Versión {mockDocument.version}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
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
                    <span>{new Date(mockDocument.uploadDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de vencimiento:</span>
                    <span>{new Date(mockDocument.expiryDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge className={getStatusColor(mockDocument.status)}>{getStatusText(mockDocument.status)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versión actual:</span>
                    <span>{mockDocument.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versiones anteriores:</span>
                    <span>{mockDocument.previousVersions.length}</span>
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
                      {mockDocument.acceptedCount}/{mockDocument.totalEmployees}
                    </div>
                    <p className="text-muted-foreground">Empleados aceptaron</p>
                  </div>
                  <Progress value={(mockDocument.acceptedCount / mockDocument.totalEmployees) * 100} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span>
                      {Math.round((mockDocument.acceptedCount / mockDocument.totalEmployees) * 100)}% aceptado
                    </span>
                    <span>{mockDocument.totalEmployees - mockDocument.acceptedCount} pendientes</span>
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
                <p>{mockDocument.description}</p>
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
                <iframe
                  src={mockDocument.fileUrl}
                  className="w-full h-[600px] border rounded"
                  title={mockDocument.title}
                />
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
                      <TableRow>
                        <TableCell className="font-medium">{mockDocument.version} (Actual)</TableCell>
                        <TableCell>{new Date(mockDocument.uploadDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(mockDocument.expiryDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                        </TableCell>
                      </TableRow>
                      {mockDocument.previousVersions.map((version, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{version.version}</TableCell>
                          <TableCell>{new Date(version.uploadDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(version.expiryDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
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
