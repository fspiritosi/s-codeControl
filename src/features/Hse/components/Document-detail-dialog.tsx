"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Users, FileText, CheckCircle, Clock, Download, ExternalLink } from "lucide-react"

interface Employee {
  id: string
  name: string
  cuil: string
  acceptedDate?: string
  status: "accepted" | "pending"
}

const mockEmployees: Employee[] = [
  { id: "1", name: "Juan Pérez", cuil: "20-12345678-9", acceptedDate: "2024-01-20", status: "accepted" },
  { id: "2", name: "María García", cuil: "27-87654321-0", acceptedDate: "2024-01-22", status: "accepted" },
  { id: "3", name: "Carlos López", cuil: "20-11111111-1", status: "pending" },
  { id: "4", name: "Ana Martínez", cuil: "27-22222222-2", acceptedDate: "2024-01-25", status: "accepted" },
  { id: "5", name: "Roberto Silva", cuil: "20-33333333-3", status: "pending" },
]

interface DocumentDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: any
}

export function DocumentDetailDialog({ open, onOpenChange, document }: DocumentDetailDialogProps) {
  if (!document) return null

  const acceptedEmployees = mockEmployees.filter((emp) => emp.status === "accepted")
  const pendingEmployees = mockEmployees.filter((emp) => emp.status === "pending")

  const generateMobileLink = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/mobile/document/${document.id}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.title}
          </DialogTitle>
          <DialogDescription>Versión {document.version} - Detalles y seguimiento de empleados</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del documento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Subido: {new Date(document.uploadDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Vence: {new Date(document.expiryDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>
                  {document.acceptedCount}/{document.totalEmployees} empleados
                </span>
              </div>
              <Badge
                className={document.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
              >
                {document.status === "active" ? "Vigente" : "Vencido"}
              </Badge>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                navigator.clipboard.writeText(generateMobileLink())
                alert("Link copiado al portapapeles")
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Copiar Link Móvil
            </Button>
          </div>

          <Separator />

          {/* Lista de empleados */}
          <div className="space-y-4">
            <h3 className="font-semibold">Seguimiento de Empleados</h3>

            <ScrollArea className="h-[300px] w-full border rounded-md p-4">
              <div className="space-y-4">
                {/* Empleados que aceptaron */}
                <div>
                  <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Aceptaron ({acceptedEmployees.length})
                  </h4>
                  <div className="space-y-2">
                    {acceptedEmployees.map((employee) => (
                      <div key={employee.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.cuil}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-700">Aceptado</p>
                          <p className="text-xs text-muted-foreground">
                            {employee.acceptedDate && new Date(employee.acceptedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Empleados pendientes */}
                <div>
                  <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pendientes ({pendingEmployees.length})
                  </h4>
                  <div className="space-y-2">
                    {pendingEmployees.map((employee) => (
                      <div key={employee.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.cuil}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-orange-700">Pendiente</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
