"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload } from "lucide-react"

interface DocumentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDocumentUploaded: (document: any) => void
}

export function DocumentUploadDialog({ open, onOpenChange, onDocumentUploaded }: DocumentUploadDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    version: "",
    expiryDate: "",
    description: "",
    file: null as File | null,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simular subida de documento
    const newDocument = {
      id: Date.now().toString(),
      title: formData.title,
      version: formData.version,
      uploadDate: new Date().toISOString().split("T")[0],
      expiryDate: formData.expiryDate,
      status: "active" as const,
      acceptedCount: 0,
      totalEmployees: 60,
      fileUrl: `/documents/${formData.file?.name || "document.pdf"}`,
    }

    onDocumentUploaded(newDocument)

    // Resetear formulario
    setFormData({
      title: "",
      version: "",
      expiryDate: "",
      description: "",
      file: null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subir Nuevo Documento</DialogTitle>
          <DialogDescription>Agrega un nuevo documento HSE al sistema</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del Documento</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Manual de Seguridad Vial"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Versión</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="Ej: 1.0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del documento..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Archivo</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                required
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Formatos permitidos: PDF, DOC, DOCX</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Subir Documento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
