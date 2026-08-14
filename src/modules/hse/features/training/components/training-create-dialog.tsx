'use client';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createTraining, fetchTrainingInstructors, updateTrainingRecordFields } from '../actions.server';
import { EMPTY_TRAINING_RECORD, type TrainingRecordData } from '../shared/record-fields';
import { TrainingRecordFields } from './TrainingRecordFields';

type Instructor = { id: string; full_name: string; position: string | null };

export function TrainingCreateDialog() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  // Datos del acta de registro (tsk-540). Se guardan en un segundo paso, una vez
  // creada la capacitación, porque necesitan su id.
  const [record, setRecord] = useState<TrainingRecordData>(EMPTY_TRAINING_RECORD);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isDialogOpen) return;
    fetchTrainingInstructors().then((data) => setInstructors(data as Instructor[]));
  }, [isDialogOpen]);

  const handleSubmit = async () => {
    toast.promise(
      async () => {
        try {
          setIsLoading(true);

          // Validación básica
          if (!formData.title.trim()) {
            setIsLoading(false);
            throw new Error('El título de la capacitación es obligatorio');
          }

          // 1. Crear la capacitación principal
          const trainingResult = await createTraining({
            title: formData.title,
            description: formData.description,
            // No se envía passing_score ya que es opcional y se manejará en la evaluación si es necesario
          });

          if (!trainingResult.success) {
            setIsLoading(false);
            // return;
            throw new Error(trainingResult.error);
          }

          // Verificar que trainingResult.data existe y tiene un id
          if (!trainingResult.data || !trainingResult.data.id) {
            setIsLoading(false);
            throw new Error('No se pudo obtener el ID de la capacitación creada');
          }

          // 2. Guardar los datos del acta (tsk-540). La capacitación nace en
          // Borrador, así que acá no se exige que estén completos: la validación
          // corre al publicarla.
          const recordResult = await updateTrainingRecordFields(trainingResult.data.id, record);
          if (!recordResult.success) {
            setIsLoading(false);
            throw new Error(recordResult.error);
          }

          // 3. Limpiar formulario y cerrar diálogo

          // Reset form
          setFormData({
            title: '',
            description: '',
          });
          setRecord(EMPTY_TRAINING_RECORD);

          setIsDialogOpen(false);
          router.refresh(); // Para actualizar la lista de capacitaciones
        } catch (error: any) {
          console.error('Error al crear capacitación:', error);

          throw error;
        } finally {
          setIsLoading(false);
        }
      },
      {
        loading: 'Creando capacitación...',
        success: 'Capacitación creada exitosamente',
        error: 'Error al crear la capacitación',
      }
    );
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Capacitación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Nueva Capacitación</DialogTitle>
          <DialogDescription>Rellena la información para crear una nueva capacitación.</DialogDescription>
        </DialogHeader>

        {/* <Tabs defaultValue="basic" className="w-full"> */}
        {/* <TabsList className="grid w-full grid-cols-2"> */}
        {/* <TabsTrigger value="basic">Información</TabsTrigger> */}
        {/* </TabsList> */}

        {/* <TabsContent value="basic" className="space-y-4"> */}
        <div className="space-y-2">
          <Label htmlFor="title">Título de la Capacitación</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Seguridad en Carretera"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe el contenido de la capacitación..."
            rows={4}
          />
        </div>

        {/* Datos del acta de registro de capacitación (tsk-540) */}
        <TrainingRecordFields value={record} onChange={setRecord} instructors={instructors} />
        {/* </TabsContent> */}
        {/* </Tabs> */}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>Crear Capacitación</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
