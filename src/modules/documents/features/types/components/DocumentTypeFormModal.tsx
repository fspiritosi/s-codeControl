'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Truck, User, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

import {
  getDocumentTypeById,
  createDocumentType,
  updateDocumentType,
} from '../actions.server';
import { ConditionsSection } from './ConditionsSection';

// ============================================
// SCHEMA
// ============================================

const documentTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  applies: z.string().min(1, 'Selecciona a quién aplica'),
  mandatory: z.boolean(),
  explired: z.boolean(),
  is_it_montlhy: z.boolean(),
  private: z.boolean(),
  down_document: z.boolean(),
  multiresource: z.boolean(),
  special: z.boolean(),
  description: z.string().optional(),
});

type DocumentTypeFormData = z.infer<typeof documentTypeSchema>;

// ============================================
// CHECKBOX CONFIG
// ============================================

const checkboxFields = [
  {
    id: 'mandatory' as const,
    label: 'Obligatorio',
    tooltip: 'El documento es obligatorio para todos los recursos',
  },
  {
    id: 'explired' as const,
    label: 'Tiene vencimiento',
    tooltip: 'El documento tiene fecha de vencimiento',
  },
  {
    id: 'is_it_montlhy' as const,
    label: 'Es mensual',
    tooltip: 'Documento mensual recurrente (ej: recibo de sueldo)',
  },
  {
    id: 'private' as const,
    label: 'Es privado',
    tooltip: 'Solo visible para roles no invitados',
  },
  {
    id: 'down_document' as const,
    label: 'Documento de baja',
    tooltip: 'Documento requerido en proceso de baja',
  },
  {
    id: 'multiresource' as const,
    label: 'Multi recurso',
    tooltip: 'Un solo documento aplica a todos los recursos',
  },
];

// ============================================
// PROPS
// ============================================

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
  appliesFilter?: string;
  onSuccess?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function DocumentTypeFormModal({
  open,
  onOpenChange,
  editId,
  appliesFilter,
  onSuccess,
}: Props) {
  const router = useRouter();
  const isEditing = !!editId;

  const form = useForm<DocumentTypeFormData>({
    resolver: zodResolver(documentTypeSchema),
    defaultValues: {
      name: '',
      applies: appliesFilter && appliesFilter !== 'all' ? appliesFilter : 'Persona',
      mandatory: false,
      explired: false,
      is_it_montlhy: false,
      private: false,
      down_document: false,
      multiresource: false,
      special: false,
      description: '',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const applies = watch('applies');
  const downDocument = watch('down_document');
  const isItMonthly = watch('is_it_montlhy');
  const explired = watch('explired');
  const special = watch('special');

  // Load existing data when editing
  useEffect(() => {
    if (!open) return;

    if (editId) {
      getDocumentTypeById(editId).then((docType) => {
        if (docType) {
          reset({
            name: docType.name,
            applies: docType.applies,
            mandatory: docType.mandatory,
            explired: docType.explired,
            is_it_montlhy: docType.is_it_montlhy ?? false,
            private: docType.private ?? false,
            down_document: docType.down_document ?? false,
            multiresource: docType.multiresource,
            special: docType.special,
            description: docType.description ?? '',
          });
        }
      });
    } else {
      reset({
        name: '',
        applies: appliesFilter && appliesFilter !== 'all' ? appliesFilter : 'Persona',
        mandatory: false,
        explired: false,
        is_it_montlhy: false,
        private: false,
        down_document: false,
        multiresource: false,
        special: false,
        description: '',
      });
    }
  }, [open, editId, appliesFilter, reset]);

  // When applies === 'Empresa', reset hidden fields
  useEffect(() => {
    if (applies === 'Empresa') {
      setValue('multiresource', false);
      setValue('down_document', false);
    }
  }, [applies, setValue]);

  // down_document logic: disable others, force mandatory
  useEffect(() => {
    if (downDocument) {
      setValue('mandatory', true);
      setValue('is_it_montlhy', false);
      setValue('explired', false);
      setValue('special', false);
      setValue('multiresource', false);
    }
  }, [downDocument, setValue]);

  // Mutual exclusion: is_it_montlhy and explired
  useEffect(() => {
    if (isItMonthly) {
      setValue('explired', false);
    }
  }, [isItMonthly, setValue]);

  useEffect(() => {
    if (explired) {
      setValue('is_it_montlhy', false);
    }
  }, [explired, setValue]);

  async function onSubmit(data: DocumentTypeFormData) {
    const payload = {
      ...data,
      conditions: [],
    };

    if (isEditing && editId) {
      const result = await updateDocumentType(editId, payload);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Tipo de documento actualizado');
    } else {
      const result = await createDocumentType(payload);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Tipo de documento creado');
    }

    onOpenChange(false);
    router.refresh();
    onSuccess?.();
  }

  // Determine which checkboxes are hidden or disabled
  function isHidden(fieldId: string) {
    if (applies === 'Empresa' && (fieldId === 'multiresource' || fieldId === 'down_document')) {
      return true;
    }
    return false;
  }

  function isDisabled(fieldId: string) {
    if (downDocument) {
      if (fieldId === 'mandatory') return true; // forced true
      if (['is_it_montlhy', 'explired', 'special', 'multiresource'].includes(fieldId)) return true;
    }
    return false;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {isEditing ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Modifica los datos del tipo de documento'
                : 'Configura un nuevo tipo de documento para tu empresa'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid gap-4 pr-2">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Ej: Licencia de conducir"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Aplica a */}
              <div className="space-y-2">
                <Label>Aplica a *</Label>
                <Select
                  value={applies}
                  onValueChange={(value) => setValue('applies', value)}
                  disabled={!!appliesFilter && appliesFilter !== 'all'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Persona">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Persona
                      </div>
                    </SelectItem>
                    <SelectItem value="Equipos">
                      <div className="flex items-center">
                        <Truck className="mr-2 h-4 w-4" />
                        Equipos
                      </div>
                    </SelectItem>
                    <SelectItem value="Empresa">
                      <div className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        Empresa
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.applies && (
                  <p className="text-sm text-destructive">{errors.applies.message}</p>
                )}
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <Label>Opciones</Label>
                <TooltipProvider delayDuration={200}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {checkboxFields.map((field) => {
                      if (isHidden(field.id)) return null;

                      const disabled = isDisabled(field.id);
                      const checked = watch(field.id);

                      return (
                        <div key={field.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={field.id}
                            checked={checked}
                            onCheckedChange={(val) => setValue(field.id, val === true)}
                            disabled={disabled}
                          />
                          <Label
                            htmlFor={field.id}
                            className={`font-normal text-sm cursor-pointer ${disabled ? 'opacity-50' : ''}`}
                          >
                            {field.label}
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-[200px]">{field.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Descripción opcional"
                  rows={2}
                />
              </div>

              {/* Condiciones (solo si special está activo y applies no es Empresa) */}
              {special && applies !== 'Empresa' && (
                <div className="space-y-2">
                  <Label>Condiciones especiales</Label>
                  <ConditionsSection applies={applies} />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
