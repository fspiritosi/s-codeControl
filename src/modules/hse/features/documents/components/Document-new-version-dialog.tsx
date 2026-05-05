"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Upload, FileText } from "lucide-react"
import { prepareHseDocumentVersion, confirmHseDocumentVersion } from '../actions.server'
import { storage } from '@/shared/lib/storage'
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface DocumentNewVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentTitle: string
  currentVersion: string
  onVersionCreated: (version: any) => void
  companyId: string
  document: {
    id: string
    title: string
    version: string
    Apartir_De: string
    uploadDate: string
    expiryDate: string
    status: string
    acceptedCount: number
    totalEmployees: number
    fileUrl: string
    description: string
}
}

export function DocumentNewVersionDialog({
  open,
  onOpenChange,
  documentTitle,
  currentVersion,
  onVersionCreated,
  companyId,
  document
}: DocumentNewVersionDialogProps) {
  const [formData, setFormData] = useState({
    version: "",
    expiryDate: "",
    description: "",
    file: null as File | null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    if (!formData.file) {
      toast.error('Por favor selecciona un archivo');
      setIsSubmitting(false);
      return;
    }
  
    try {
      const file = formData.file;

      const prep = await prepareHseDocumentVersion({
        documentId: document.id,
        companyId,
        fileName: file.name,
        version: formData.version,
      });
      if (!prep.ok) throw new Error(prep.error);

      try {
        await storage.upload(prep.bucket, prep.path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });
      } catch (e: any) {
        throw new Error('No se pudo subir el archivo: ' + (e?.message || ''));
      }

      try {
        await confirmHseDocumentVersion({
          documentId: document.id,
          companyId,
          path: prep.path,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          version: formData.version,
          expiryDate: formData.expiryDate || null,
          description: formData.description || null,
        });
      } catch (confirmErr) {
        try { await storage.remove(prep.bucket, [prep.path]); } catch {}
        throw confirmErr;
      }

      toast.success('Nueva versión creada exitosamente');
      
      // Call the onVersionCreated callback with the new version data
      const newVersion = {
        id: Date.now().toString(),
        title: documentTitle,
        version: formData.version,
        uploadDate: new Date().toISOString().split("T")[0],
        expiryDate: formData.expiryDate || "sin vencimiento",
        status: "active" as const,
        acceptedCount: 0,
        totalEmployees: 60,
        fileUrl: URL.createObjectURL(formData.file),
        description: formData.description,
      };
  
      onVersionCreated(newVersion);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating new version:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear la nueva versión');
    } finally {
      setIsSubmitting(false);
    }
    router.push(`/dashboard/hse`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nueva Versión del Documento
          </DialogTitle>
          <DialogDescription>Agrega una nueva versión de {documentTitle}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-title">Título del Documento</Label>
            <Input id="document-title" value={documentTitle} disabled className="bg-gray-50" />
            <p className="text-xs text-muted-foreground">El título no se puede modificar al crear una nueva versión</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current-version">Versión Actual</Label>
              <Input id="current-version" value={currentVersion} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-version">Nueva Versión</Label>
              <Input
                id="new-version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="Ej: 2.2"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción de Cambios (Opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe los cambios realizados en esta versión..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Archivo de la Nueva Versión</Label>
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
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creando nueva versión...' : 'Crear Nueva Versión'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
