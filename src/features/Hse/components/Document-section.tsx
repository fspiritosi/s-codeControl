"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, Calendar, Users, Eye, Download } from "lucide-react"
import { DocumentUploadDialog } from "./Document-upload-dialog"
import { DocumentDetailDialog } from "./Document-detail-dialog"
import { useRouter } from "next/navigation"

interface Document {
  id: string
  title: string
  version: string
  uploadDate: string
  expiryDate: string
  status: "active" | "expired" | "pending"
  acceptedCount: number
  totalEmployees: number
  fileUrl: string
}

const mockDocuments: Document[] = [
  {
    id: "1",
    title: "Manual de Seguridad Vial",
    version: "2.1",
    uploadDate: "2024-01-15",
    expiryDate: "2024-12-31",
    status: "active",
    acceptedCount: 45,
    totalEmployees: 60,
    fileUrl: "/documents/manual-seguridad.pdf",
  },
  {
    id: "2",
    title: "Protocolo de Emergencias",
    version: "1.3",
    uploadDate: "2024-02-01",
    expiryDate: "2024-11-30",
    status: "active",
    acceptedCount: 38,
    totalEmployees: 60,
    fileUrl: "/documents/protocolo-emergencias.pdf",
  },
  {
    id: "3",
    title: "Normas de Higiene Industrial",
    version: "3.0",
    uploadDate: "2023-12-01",
    expiryDate: "2024-01-31",
    status: "expired",
    acceptedCount: 60,
    totalEmployees: 60,
    fileUrl: "/documents/normas-higiene.pdf",
  },
  {
    id: "4",
    title: "Manual de Equipos de Protección",
    version: "1.5",
    uploadDate: "2023-10-15",
    expiryDate: "2023-12-31",
    status: "expired",
    acceptedCount: 55,
    totalEmployees: 60,
    fileUrl: "/documents/epp-manual.pdf",
  },
  {
    id: "5",
    title: "Procedimientos de Limpieza",
    version: "2.0",
    uploadDate: "2023-08-01",
    expiryDate: "2023-11-30",
    status: "expired",
    acceptedCount: 48,
    totalEmployees: 60,
    fileUrl: "/documents/limpieza.pdf",
  },
]

export function DocumentsSection() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const router = useRouter()

  const activeDocuments = documents.filter((doc) => doc.status === "active")
  const expiredDocuments = documents.filter((doc) => doc.status === "expired")

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

  const DocumentGrid = ({ documents }: { documents: Document[] }) => (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {documents.map((document) => (
        <Card key={document.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <Badge className={getStatusColor(document.status)}>{getStatusText(document.status)}</Badge>
            </div>
            <CardTitle className="text-base sm:text-lg line-clamp-2">{document.title}</CardTitle>
            <CardDescription>Versión {document.version}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Vence: {new Date(document.expiryDate).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span>
                {document.acceptedCount}/{document.totalEmployees} empleados
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(document.acceptedCount / document.totalEmployees) * 100}%` }}
              ></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs sm:text-sm"
                onClick={() => {
                  router.push(`/document/${document.id}/detail`)
                }}
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Ver Detalle
              </Button>
              <Button variant="outline" size="sm" className="sm:w-auto">
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Documentos HSE</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestiona los documentos de higiene, seguridad y medio ambiente
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Subir Documento
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="text-xs sm:text-sm">
            Vigentes ({activeDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="text-xs sm:text-sm">
            No Vigentes ({expiredDocuments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeDocuments.length > 0 ? (
            <DocumentGrid documents={activeDocuments} />
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay documentos vigentes</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          {expiredDocuments.length > 0 ? (
            <DocumentGrid documents={expiredDocuments} />
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay documentos vencidos</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onDocumentUploaded={(newDoc) => {
          setDocuments([...documents, newDoc])
          setShowUploadDialog(false)
        }}
      />

      <DocumentDetailDialog open={showDetailDialog} onOpenChange={setShowDetailDialog} document={selectedDocument} />
    </div>
  )
}
