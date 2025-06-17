"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, Calendar, Users, Eye, Download } from "lucide-react"
// import { DocumentUploadDialog } from "./Document-upload-dialog"
// import { DocumentDetailDialog } from "./Document-detail-dialog"
import { useRouter } from "next/navigation"
import {getDocuments,getEmployeesWithAssignedDocuments} from '@/features/Hse/actions/documents'
import Cookies from 'js-cookie'
import { Input } from "@/components/ui/input"
import { Filter } from "lucide-react";
import { toast } from "sonner"
import { supabaseBrowser } from "@/lib/supabase/browser"

interface Document {
  id: string
  title: string
  version: string
  upload_date: string
  expiry_date: string | null
  status: "active" | "expired" | "pending"
  acceptedCount?: number
  totalEmployees?: number
  file_path: string
  file_name: string
  file_size: string
}


type EmployeeCounts = {
  total: number;
  accepted: number;
};
export function DocumentsSection() {
  const company_id = Cookies.get('actualComp')
  const supabase = supabaseBrowser()
  console.log(company_id)
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [employees, setEmployees] = useState<any[]>([])
  const router = useRouter()
console.log(documents)
  const filterDocuments = (documents: Document[]) => {
    return documents.filter((document) => {
      const matchesSearch =
        document.title.toLowerCase().includes(searchTerm.toLowerCase());
    
      // const matchesTag = tagFilter === 'all' || document.tags.includes(tagFilter);
    
      return matchesSearch;
    });
  };
 
  useEffect(() => {
    const fetchDocuments = async () => {
      const documentos = await getDocuments(company_id || "");
      setDocuments(documentos as any);
    };
    const fetchEmployees = async () => {
      const empleados = await getEmployeesWithAssignedDocuments();
      setEmployees(empleados as any);
    };
    fetchDocuments();
    fetchEmployees();
  }, [company_id]);
  const activeDocuments = documents.filter((doc) => doc.status === "active")
  const expiredDocuments = documents.filter((doc) => doc.status === "expired")
  console.log(activeDocuments)
  console.log(expiredDocuments)
  console.log(employees)
console.log(documents)
const getEmployeeCounts = (documentId: string): EmployeeCounts => {
  if (!employees?.data) return { total: 0, accepted: 0 };

  const counts = employees.data.reduce((acc: EmployeeCounts, employee) => {
    // Buscar si el empleado tiene el documento
    const hasDocument = employee.documents.some(
      (doc:any)=> doc.document.id === documentId
    );

    if (hasDocument) {
      acc.total += 1;
      
      // Verificar si el documento está aceptado
      const isAccepted = employee.documents.some(
        (doc:any) => doc.document.id === documentId && doc.status === 'accepted'
      );
      
      if (isAccepted) {
        acc.accepted += 1;
      }
    }

    return acc;
  }, { total: 0, accepted: 0 });

  return counts;
};
// const getDocumentUrl = (filePath: string) => {
//   if (!filePath) return '';
//   const { data } = supabase.storage
//     .from('documents-hse') // Asegúrate de que este sea el nombre correcto de tu bucket
//     .getPublicUrl(filePath);
//   return data.publicUrl;
// };
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
    <div>
      
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
              <span className="truncate">Vence: {document.expiry_date ? new Date(document.expiry_date).toLocaleDateString() : "sin vencimiento"}</span>
            </div>

            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span>
                {getEmployeeCounts(document.id).accepted}/{getEmployeeCounts(document.id).total} empleados
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${((getEmployeeCounts(document.id).accepted || 0) / (getEmployeeCounts(document.id).total || 0)) * 100}%` }}
              ></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs sm:text-sm"
                onClick={() => {
                  router.push(`/dashboard/hse/document/${document.id}/detail`)
                }}
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Ver Detalle
              </Button>
              <Button variant="outline" size="sm" className="sm:w-auto" onClick={() => handleDownload(document.file_path, document.file_name)}>
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    </div>
  )

  const handleDownload = (file_path: string, file_name: string) => {
      console.log(file_path)
      try {
        const doc = window.document
        const link = doc.createElement('a')
        link.href = file_path
        link.download = file_name
        doc.body.appendChild(link)
        link.click()
        doc.body.removeChild(link)
      } catch (error) {
        console.error('Error al descargar el archivo:', error)
        toast.error('Error al descargar el archivo')
      } 
    }
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
      </div> */}

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
          <div>
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-3 pr-8 w-full"
                />
                <Filter className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
          </div>
            <DocumentGrid documents={filterDocuments(activeDocuments)} />
              </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay documentos vigentes</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          {expiredDocuments.length > 0 ? (
            <div>
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-3 pr-8 w-full"
                />
                <Filter className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
          </div>
            <DocumentGrid documents={filterDocuments(expiredDocuments)} />
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay documentos vencidos</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onDocumentUploaded={(newDoc) => {
          setDocuments([...documents, newDoc])
          setShowUploadDialog(false)
        }}
      /> */}

      {/* <DocumentDetailDialog open={showDetailDialog} onOpenChange={setShowDetailDialog} document={selectedDocument} /> */}
    </div>
  )
}
