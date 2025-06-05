'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createDocument } from '@/features/Hse/actions/documents';
import { Plus, Upload } from 'lucide-react';
import { useState } from 'react';

export function DocumentUploadDialog() {
  const [formData, setFormData] = useState({
    title: '',
    version: '',
    expiryDate: '',
    description: '',
    file: null as File | null,
    file_url: '',
    file_name: '',
    file_size: 0,
    file_type: '',
    status: 'active',
    upload_date: '',
    created_by: '',
  });
  // const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault()
  //   createDocument(formData as any)
  // }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          {' '}
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subir Nuevo Documento</DialogTitle>
          <DialogDescription>Agrega un nuevo documento HSE al sistema</DialogDescription>
        </DialogHeader>

        <form action={createDocument} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del Documento</Label>
            <Input
              id="title"
              name="title"
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
                name="version"
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
                name="expiryDate"
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
              name="description"
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
                name="file" // <--- ¡esto es obligatorio!
                type="file"
                accept=".pdf,.doc,.docx"
                required
              />

              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Formatos permitidos: PDF, DOC, DOCX</p>
          </div>

          <DialogFooter>
            <DialogClose>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Subir Documento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
